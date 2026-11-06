import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

// Path for caching downloaded Bhavcopy reports
const CACHE_DIR = path.resolve(process.cwd(), 'data/cache/bhavcopy');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// In-memory cache for ultra-fast subsequent queries
const memoryCache = new Map();

/**
 * Format Date object to YYYYMMDD string in IST timezone (Asia/Kolkata)
 */
export function formatToYYYYMMDD(date = new Date()) {
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = istFormatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}${month}${day}`;
}

/**
 * Format YYYYMMDD to YYYY-MM-DD
 */
export function formatToDashedDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

/**
 * Convert Date or YYYY-MM-DD string to YYYYMMDD
 */
export function parseDateInput(input) {
  if (!input) return formatToYYYYMMDD();
  if (typeof input === 'string') {
    const cleaned = input.replace(/[^0-9]/g, '');
    if (cleaned.length === 8) return cleaned;
  }
  const d = new Date(input);
  if (!isNaN(d.getTime())) return formatToYYYYMMDD(d);
  return formatToYYYYMMDD();
}

/**
 * Standard browser headers to avoid NSE anti-scraping blocks
 */
const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  Referer: 'https://www.nseindia.com/all-reports',
};

/**
 * Fetch NSE session cookies if ever challenged
 */
let sessionCookies = '';
let lastCookieTime = 0;

async function getOrRefreshNseCookies() {
  const now = Date.now();
  // Refresh cookies every 15 minutes if needed
  if (sessionCookies && now - lastCookieTime < 15 * 60 * 1000) {
    return sessionCookies;
  }

  try {
    const res = await fetch('https://www.nseindia.com', {
      headers: DEFAULT_HEADERS,
      redirect: 'follow',
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      // Extract cookies
      sessionCookies = setCookie
        .split(',')
        .map((c) => c.split(';')[0].trim())
        .join('; ');
      lastCookieTime = now;
    }
  } catch (err) {
    console.warn('[NSE Cookie Warning]:', err.message);
  }
  return sessionCookies;
}

/**
 * Download Bhavcopy zip file for given YYYYMMDD date
 */
export async function downloadBhavcopyZip(dateStr) {
  const zipPath = path.join(CACHE_DIR, `BhavCopy_NSE_CM_0_0_0_${dateStr}_F_0000.csv.zip`);

  // Check filesystem cache first
  if (fs.existsSync(zipPath)) {
    const stat = fs.statSync(zipPath);
    if (stat.size > 1000) {
      console.log(`[NSE Bhavcopy]: Found in filesystem cache: ${zipPath}`);
      return fs.readFileSync(zipPath);
    }
  }

  const url = `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_${dateStr}_F_0000.csv.zip`;
  console.log(`[NSE Bhavcopy]: Fetching from official source: ${url}`);

  const headers = { ...DEFAULT_HEADERS };
  if (sessionCookies) {
    headers['Cookie'] = sessionCookies;
  }

  let res;
  try {
    res = await fetch(url, { headers });
  } catch (netErr) {
    const dashed = formatToDashedDate(dateStr);
    const d = new Date(dashed);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const error = new Error(`NSE Bhavcopy report not found for ${dashed} (market was closed on weekend)`);
      error.status = 404;
      error.date = dashed;
      throw error;
    }
    const error = new Error(`Network failure while requesting NSE report for ${dashed}: ${netErr.message}`);
    error.status = 503;
    error.date = dashed;
    throw error;
  }

  // If 403, try initializing cookies and retry once
  if (res.status === 403) {
    console.log('[NSE Bhavcopy]: 403 Forbidden received. Refreshing NSE cookies...');
    const cookies = await getOrRefreshNseCookies();
    if (cookies) {
      headers['Cookie'] = cookies;
      res = await fetch(url, { headers });
    }
  }

  if (res.status === 404) {
    const dashed = formatToDashedDate(dateStr);
    const error = new Error(`NSE Bhavcopy report not found for ${dashed} (market was closed or report not yet published)`);
    error.status = 404;
    error.date = dashed;
    throw error;
  }

  if (!res.ok) {
    const error = new Error(`Failed to fetch NSE Bhavcopy: HTTP ${res.status} ${res.statusText}`);
    error.status = res.status;
    throw error;
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate ZIP header (starts with PK\x03\x04 or 0x50 0x4B 0x03 0x04)
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error('Downloaded file is not a valid ZIP archive from NSE.');
  }

  // Save to disk cache
  fs.writeFileSync(zipPath, buffer);
  console.log(`[NSE Bhavcopy]: Successfully cached ${zipPath} (${buffer.length} bytes)`);

  return buffer;
}

/**
 * Parse CSV text into normalized stock objects with UDiFF column names
 */
export function parseUdiffCsv(csvContent) {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error('Bhavcopy CSV file is empty or corrupted');
  }

  const headers = lines[0].split(',').map((h) => h.trim());

  // Verify key UDiFF columns exist
  const reqCols = ['TradDt', 'TckrSymb', 'SctySrs', 'OpnPric', 'HghPric', 'LwPric', 'ClsPric', 'PrvsClsgPric'];
  for (const col of reqCols) {
    if (!headers.includes(col)) {
      throw new Error(`Invalid UDiFF format: missing required column '${col}'`);
    }
  }

  const colIdx = {
    tradDt: headers.indexOf('TradDt'),
    bizDt: headers.indexOf('BizDt'),
    sgmt: headers.indexOf('Sgmt'),
    src: headers.indexOf('Src'),
    finInstrmTp: headers.indexOf('FinInstrmTp'),
    finInstrmId: headers.indexOf('FinInstrmId'),
    isin: headers.indexOf('ISIN'),
    tckrSymb: headers.indexOf('TckrSymb'),
    sctySrs: headers.indexOf('SctySrs'),
    finInstrmNm: headers.indexOf('FinInstrmNm'),
    opnPric: headers.indexOf('OpnPric'),
    hghPric: headers.indexOf('HghPric'),
    lwPric: headers.indexOf('LwPric'),
    clsPric: headers.indexOf('ClsPric'),
    lastPric: headers.indexOf('LastPric'),
    prvsClsgPric: headers.indexOf('PrvsClsgPric'),
    sttlmPric: headers.indexOf('SttlmPric'),
    ttlTradgVol: headers.indexOf('TtlTradgVol'),
    ttlTrfVal: headers.indexOf('TtlTrfVal'),
    ttlNbOfTxsExctd: headers.indexOf('TtlNbOfTxsExctd'),
  };

  const stocks = [];
  let tradingDate = '';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    if (cols.length < headers.length) continue;

    const symbol = cols[colIdx.tckrSymb]?.trim();
    const series = cols[colIdx.sctySrs]?.trim();
    if (!symbol || !series) continue;

    const rowDate = cols[colIdx.tradDt]?.trim();
    if (!tradingDate && rowDate) {
      tradingDate = rowDate;
    }

    const open = parseFloat(cols[colIdx.opnPric]) || 0;
    const high = parseFloat(cols[colIdx.hghPric]) || 0;
    const low = parseFloat(cols[colIdx.lwPric]) || 0;
    const close = parseFloat(cols[colIdx.clsPric]) || 0;
    const prevClose = parseFloat(cols[colIdx.prvsClsgPric]) || 0;
    const lastPrice = parseFloat(cols[colIdx.lastPric]) || close;
    const settlementPrice = parseFloat(cols[colIdx.sttlmPric]) || close;
    const volume = parseInt(cols[colIdx.ttlTradgVol], 10) || 0;
    const tradedValue = parseFloat(cols[colIdx.ttlTrfVal]) || 0;
    const trades = parseInt(cols[colIdx.ttlNbOfTxsExctd], 10) || 0;

    // Daily change calculations
    const change = +(close - prevClose).toFixed(2);
    const changePercent =
      prevClose > 0 ? +(((close - prevClose) / prevClose) * 100).toFixed(2) : 0;

    // VWAP calculation (Traded Value / Traded Volume)
    const vwap = volume > 0 ? +(tradedValue / volume).toFixed(2) : close;

    stocks.push({
      symbol,
      name: cols[colIdx.finInstrmNm]?.trim() || symbol,
      isin: cols[colIdx.isin]?.trim() || '',
      series,
      tradingDate: rowDate || tradingDate,
      open,
      high,
      low,
      close,
      previousClose: prevClose,
      lastPrice,
      settlementPrice,
      change,
      changePercent,
      volume,
      tradedValue,
      trades,
      vwap,
      // Deliverable qty is published separately by NSE in MTO report, noted as not in CM-UDiFF
      deliverableQty: null,
      segment: cols[colIdx.sgmt]?.trim() || 'CM',
      instrumentType: cols[colIdx.finInstrmTp]?.trim() || 'STK',
    });
  }

  return {
    tradingDate,
    stocks,
  };
}

/**
 * Extract zip and parse Bhavcopy
 */
export async function getBhavcopyByDate(dateStr) {
  // Check memory cache
  if (memoryCache.has(dateStr)) {
    return memoryCache.get(dateStr);
  }

  const jsonCachePath = path.join(CACHE_DIR, `bhavcopy_${dateStr}.json`);
  if (fs.existsSync(jsonCachePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonCachePath, 'utf8'));
      memoryCache.set(dateStr, data);
      return data;
    } catch {
      // If corrupted, re-parse from zip
    }
  }

  const zipBuffer = await downloadBhavcopyZip(dateStr);
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const csvEntry = entries.find((e) => e.entryName.toLowerCase().endsWith('.csv'));

  if (!csvEntry) {
    throw new Error('No CSV file found inside NSE Bhavcopy ZIP archive.');
  }

  const csvContent = zip.readAsText(csvEntry);
  const { tradingDate, stocks } = parseUdiffCsv(csvContent);

  const result = {
    tradingDate: tradingDate || formatToDashedDate(dateStr),
    fileName: csvEntry.entryName,
    retrievedAt: new Date().toISOString(),
    totalParsed: stocks.length,
    stocks,
  };

  // Cache to disk and memory
  fs.writeFileSync(jsonCachePath, JSON.stringify(result));
  memoryCache.set(dateStr, result);

  return result;
}

/**
 * Find the most recent date available in local disk cache
 */
export function getMostRecentCachedDate() {
  if (!fs.existsSync(CACHE_DIR)) return null;
  const files = fs.readdirSync(CACHE_DIR);
  const jsonFiles = files
    .filter((f) => f.startsWith('bhavcopy_') && f.endsWith('.json'))
    .sort()
    .reverse();
  if (jsonFiles.length > 0) {
    const match = jsonFiles[0].match(/bhavcopy_(\d{8})\.json/);
    if (match) return match[1];
  }
  const zipFiles = files
    .filter((f) => f.includes('BhavCopy_NSE_CM') && f.endsWith('.zip'))
    .sort()
    .reverse();
  if (zipFiles.length > 0) {
    const match = zipFiles[0].match(/(\d{8})/);
    if (match) return match[1];
  }
  return null;
}

/**
 * Walk backwards from today up to maxDays to locate the latest published Bhavcopy
 */
export async function getLatestBhavcopy(maxDays = 7) {
  // Start with today in IST
  const now = new Date();
  let candidateDate = new Date(now);
  let lastNetworkError = null;

  for (let i = 0; i < maxDays; i++) {
    const yyyymmdd = formatToYYYYMMDD(candidateDate);
    try {
      console.log(`[NSE Bhavcopy]: Checking availability for date: ${yyyymmdd}`);
      const data = await getBhavcopyByDate(yyyymmdd);
      return data;
    } catch (err) {
      if (err.status === 404) {
        console.log(`[NSE Bhavcopy]: Report not available for ${yyyymmdd}. Moving to previous day...`);
        // Subtract 1 day
        candidateDate.setDate(candidateDate.getDate() - 1);
        continue;
      }

      // If network failure / DNS error, log warning and check if earlier date or cache is available
      console.warn(`[NSE Bhavcopy Warning]: Network check failed for ${yyyymmdd} (${err.message}). Checking cache/earlier days...`);
      lastNetworkError = err;
      candidateDate.setDate(candidateDate.getDate() - 1);
    }
  }

  // If live fetches failed (e.g. network restricted or offline), check if we have any recently cached report
  const cachedDate = getMostRecentCachedDate();
  if (cachedDate) {
    console.log(`[NSE Bhavcopy]: Serving latest available cached report for ${cachedDate}`);
    return await getBhavcopyByDate(cachedDate);
  }

  throw lastNetworkError || new Error(`Unable to locate any published NSE Bhavcopy report in the last ${maxDays} days.`);
}

/**
 * Generate market summary stats from stock list
 */
export function generateMarketSummary(stocks, tradingDate) {
  // Filter equity series for standard summary metrics
  const eqStocks = stocks.filter((s) => s.series === 'EQ');
  const targetList = eqStocks.length > 0 ? eqStocks : stocks;

  const totalStocks = targetList.length;
  const advancers = targetList.filter((s) => s.change > 0).length;
  const decliners = targetList.filter((s) => s.change < 0).length;
  const unchanged = targetList.filter((s) => s.change === 0).length;

  const top10Gainers = [...targetList]
    .filter((s) => s.previousClose > 0 && s.volume > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 10);

  const top10Losers = [...targetList]
    .filter((s) => s.previousClose > 0 && s.volume > 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 10);

  const highestVolume = [...targetList]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  const highestValue = [...targetList]
    .sort((a, b) => b.tradedValue - a.tradedValue)
    .slice(0, 10);

  return {
    tradingDate,
    totalStocks,
    advancers,
    decliners,
    unchanged,
    top10Gainers,
    top10Losers,
    highestVolume,
    highestValue,
    source: 'NSE CM-UDiFF Common Bhavcopy Final',
    lastUpdated: new Date().toISOString(),
  };
}
