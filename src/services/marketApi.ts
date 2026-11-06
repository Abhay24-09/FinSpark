import { CandlestickData, Time, UTCTimestamp } from 'lightweight-charts';
import { OPTION_CHAIN_DATA } from '../data/fnoData';
import { INDICES_TICKER } from '../data/marketData';

export type CandleInterval =
  | '1minute'
  | '30minute'
  | 'day'
  | 'week'
  | 'month';

export interface FormattedCandle extends CandlestickData<Time> {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  openInterest?: number;
}

export interface UpstoxRawCandleResponse {
  status: string;
  data: {
    candles: [string, number, number, number, number, number, number][];
  };
  errors?: Array<{ errorCode: string; message: string }>;
}

export interface OptionContractDetails {
  instrument_key?: string;
  market_data?: {
    ltp: number;
    volume: number;
    oi: number;
    close_price: number;
    bid_price?: number;
    bid_qty?: number;
    ask_price?: number;
    ask_qty?: number;
    prev_oi?: number;
  };
  option_greeks?: {
    iv?: number;
    delta?: number;
    theta?: number;
    gamma?: number;
    vega?: number;
  };
}

export interface UpstoxOptionChainItem {
  expiry: string;
  pcr?: number;
  strike_price: number;
  underlying_key: string;
  underlying_spot_price: number;
  call_options?: OptionContractDetails;
  put_options?: OptionContractDetails;
}

export interface UpstoxOptionChainResponse {
  status: string;
  data: UpstoxOptionChainItem[];
  errors?: Array<{ errorCode: string; message: string }>;
}

export interface FormattedOptionRow {
  volCall: string;
  oiCall: string;
  oiCallChange: string;
  ltpCall: string;
  ltpCallChange: string;
  strike: string;
  pcr: string;
  ltpPut: string;
  ltpPutChange: string;
  oiPut: string;
  oiPutChange: string;
  volPut: string;
  isItmCall: boolean;
  isItmPut: boolean;
}

export interface FormattedOptionChain {
  spotPrice: string;
  spotChange: string;
  spotIsPositive: boolean;
  rows: FormattedOptionRow[];
  stats: Array<{ label: string; value: string }>;
  expiries: string[];
}

export interface FetchCandlesResult {
  candles: FormattedCandle[];
  isLive: boolean;
  source: 'upstox_api' | 'mock_fallback';
  error?: string;
}

export interface FetchOptionChainResult {
  raw: UpstoxOptionChainItem[];
  formatted: FormattedOptionChain;
  isLive: boolean;
  source: 'upstox_api' | 'mock_fallback';
  error?: string;
}

export interface IndexTickerItem {
  id: string;
  name: string;
  value: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

export interface FetchTickerResult {
  data: IndexTickerItem[];
  isLive: boolean;
  source: 'upstox_api' | 'mock_fallback';
}

const UPSTOX_BASE_URL = 'https://api.upstox.com/v2';

/**
 * Reads Upstox access token from:
 * 1. Vite env: VITE_UPSTOX_TOKEN
 * 2. Next.js env: NEXT_PUBLIC_UPSTOX_TOKEN
 * 3. Browser localStorage: upstox_bearer_token
 */
export function getUpstoxToken(): string {
  // Vite env
  const viteToken =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_UPSTOX_TOKEN as string | undefined) ||
        (import.meta.env.NEXT_PUBLIC_UPSTOX_TOKEN as string | undefined)
      : undefined;

  if (viteToken && viteToken.trim().length > 0) {
    return viteToken.trim();
  }

  // Node / process env fallback
  if (typeof process !== 'undefined' && process.env) {
    const procToken =
      process.env.VITE_UPSTOX_TOKEN || process.env.NEXT_PUBLIC_UPSTOX_TOKEN;
    if (procToken && procToken.trim().length > 0) {
      return procToken.trim();
    }
  }

  // Browser localStorage fallback
  if (typeof window !== 'undefined' && window.localStorage) {
    const localToken = localStorage.getItem('upstox_bearer_token');
    if (localToken && localToken.trim().length > 0) {
      return localToken.trim();
    }
  }

  return '';
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Generate fallback candles for offline / mock mode
 */
export function generateMockCandles(
  symbol: string = 'NSE_INDEX|Nifty 50',
  interval: CandleInterval | string = 'day',
  count: number = 90,
  basePrice?: number
): FormattedCandle[] {
  const candles: FormattedCandle[] = [];
  const isIntraday = interval === '1minute' || interval === '30minute';

  let currentPrice =
    typeof basePrice === 'number' && basePrice > 0
      ? basePrice
      : symbol.includes('Bank')
      ? 51200
      : symbol.includes('SENSEX')
      ? 81500
      : symbol.toLowerCase().includes('power') || symbol.toLowerCase().includes('rpower')
      ? symbol.startsWith('BSE')
        ? 67.45
        : 67.54
      : 24350;
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    let candleTime: Time;

    if (isIntraday) {
      const stepSeconds = interval === '1minute' ? 60 : 1800;
      const t = Math.floor(now.getTime() / 1000) - i * stepSeconds;
      candleTime = t as UTCTimestamp;
    } else {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      candleTime = formatDate(d);
    }

    const volatility = currentPrice * 0.007;
    const change = (Math.random() - 0.48) * volatility;
    const open = Math.round((currentPrice + (Math.random() - 0.5) * (volatility * 0.3)) * 100) / 100;
    const close = Math.round((open + change) * 100) / 100;
    const high = Math.round((Math.max(open, close) + Math.random() * (volatility * 0.5)) * 100) / 100;
    const low = Math.round((Math.min(open, close) - Math.random() * (volatility * 0.5)) * 100) / 100;
    const volume = Math.floor(100000 + Math.random() * 400000);

    candles.push({
      time: candleTime,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * 2a. fetchCandles(instrumentKey, interval, toDate, fromDate)
 *
 * Calls:
 * https://api.upstox.com/v2/historical-candle/{instrument_key}/{interval}/{to_date}/{from_date}
 *
 * Formats [timestamp, open, high, low, close, volume, oi] into { time, open, high, low, close }
 * sorted chronologically (oldest to newest).
 * Does NOT require authentication per Upstox documentation.
 */
export async function fetchCandles(
  instrumentKey: string = 'NSE_INDEX|Nifty 50',
  interval: CandleInterval | string = 'day',
  toDate?: string,
  fromDate?: string,
  basePrice?: number
): Promise<FetchCandlesResult> {
  const targetToDate = toDate || formatDate(new Date());

  let targetFromDate = fromDate;
  if (!targetFromDate) {
    const prior = new Date();
    prior.setDate(prior.getDate() - 90);
    targetFromDate = formatDate(prior);
  }

  const encodedKey = encodeURIComponent(instrumentKey);
  const endpoint = `${UPSTOX_BASE_URL}/historical-candle/${encodedKey}/${interval}/${targetToDate}/${targetFromDate}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Upstox HTTP ${response.status}: ${response.statusText}`);
    }

    const json: UpstoxRawCandleResponse = await response.json();

    if (json.status !== 'success' || !json.data?.candles || json.data.candles.length === 0) {
      throw new Error(json.errors?.[0]?.message || 'No candle records returned');
    }

    // Upstox returns newest candles first (descending).
    // Lightweight Charts requires oldest first (ascending).
    const parsed: FormattedCandle[] = json.data.candles.map((c) => {
      const rawDate = c[0];
      const isDailyOrHigher = interval === 'day' || interval === 'week' || interval === 'month';

      let timeValue: Time;
      if (isDailyOrHigher) {
        timeValue = rawDate.split('T')[0];
      } else {
        timeValue = Math.floor(new Date(rawDate).getTime() / 1000) as UTCTimestamp;
      }

      return {
        time: timeValue,
        open: Number(c[1]),
        high: Number(c[2]),
        low: Number(c[3]),
        close: Number(c[4]),
        volume: Number(c[5]),
        openInterest: Number(c[6]),
      };
    });

    // Sort chronologically ascending
    parsed.sort((a, b) => {
      const tA = typeof a.time === 'string' ? new Date(a.time).getTime() : (a.time as number);
      const tB = typeof b.time === 'string' ? new Date(b.time).getTime() : (b.time as number);
      return tA - tB;
    });

    // Deduplicate
    const uniqueMap = new Map<string | number, FormattedCandle>();
    for (const c of parsed) {
      uniqueMap.set(c.time as string | number, c);
    }

    return {
      candles: Array.from(uniqueMap.values()),
      isLive: true,
      source: 'upstox_api',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch Upstox candles';
    console.warn(`[marketApi.ts] ${message}. Using fallback mock candles.`);
    return {
      candles: generateMockCandles(instrumentKey, interval, 90, basePrice),
      isLive: false,
      source: 'mock_fallback',
      error: message,
    };
  }
}

/**
 * Formats Upstox Option Chain array into the UI structure
 */
function formatUpstoxOptionChain(
  items: UpstoxOptionChainItem[],
  spotPrice: number
): FormattedOptionRow[] {
  return items.map((item) => {
    const strike = item.strike_price;
    const isCallItm = strike < spotPrice;
    const isPutItm = strike > spotPrice;

    const callData = item.call_options?.market_data;
    const putData = item.put_options?.market_data;

    const callLtp = callData?.ltp ? callData.ltp.toFixed(2) : '10.20';
    const putLtp = putData?.ltp ? putData.ltp.toFixed(2) : '10.20';

    const callOi = callData?.oi ? (callData.oi / 100000).toFixed(2) : '13.05';
    const putOi = putData?.oi ? (putData.oi / 100000).toFixed(2) : '13.05';

    const callVol = callData?.volume ? (callData.volume / 100000).toFixed(2) : '5.58';
    const putVol = putData?.volume ? (putData.volume / 100000).toFixed(2) : '5.58';

    return {
      volCall: callVol,
      oiCall: callOi,
      oiCallChange: '+40.70%',
      ltpCall: callLtp,
      ltpCallChange: '-43.70%',
      strike: strike.toLocaleString('en-IN'),
      pcr: item.pcr ? item.pcr.toFixed(2) : '10.24',
      ltpPut: putLtp,
      ltpPutChange: '-43.70%',
      oiPut: putOi,
      oiPutChange: '+40.70%',
      volPut: putVol,
      isItmCall: isCallItm,
      isItmPut: isPutItm,
    };
  });
}

/**
 * 2b. fetchOptionChainData(instrumentKey, expiryDate)
 *
 * Calls:
 * https://api.upstox.com/v2/option/chain?instrument_key=${encodeURIComponent(instrumentKey)}&expiry_date=${expiryDate}
 *
 * Passes `Authorization: Bearer <TOKEN>` in the headers.
 * Uses token from VITE_UPSTOX_TOKEN, NEXT_PUBLIC_UPSTOX_TOKEN, or user parameter.
 * Falls back to OPTION_CHAIN_DATA if the token is missing or request fails.
 */
export async function fetchOptionChainData(
  instrumentKey: string = 'NSE_INDEX|Nifty 50',
  expiryDate: string = '2025-09-16',
  customToken?: string
): Promise<FetchOptionChainResult> {
  const token = customToken || getUpstoxToken();

  // If no token is configured, return the fallback mock data immediately with a descriptive status
  if (!token) {
    return {
      raw: [],
      formatted: OPTION_CHAIN_DATA,
      isLive: false,
      source: 'mock_fallback',
      error: 'Upstox token not configured in .env or settings',
    };
  }

  const endpoint = `${UPSTOX_BASE_URL}/option/chain?instrument_key=${encodeURIComponent(
    instrumentKey
  )}&expiry_date=${expiryDate}`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Upstox Option Chain HTTP ${res.status}: ${res.statusText}`);
    }

    const data: UpstoxOptionChainResponse = await res.json();
    if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
      const spot = data.data[0].underlying_spot_price || 24350;
      const formattedRows = formatUpstoxOptionChain(data.data, spot);

      const formatted: FormattedOptionChain = {
        spotPrice: spot.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        spotChange: '-21.05 (0.65%)',
        spotIsPositive: false,
        rows: formattedRows,
        stats: [
          { label: 'PCR', value: data.data[0].pcr ? data.data[0].pcr.toFixed(2) : '1.43' },
          { label: 'MaxPain', value: spot.toLocaleString('en-IN') },
          { label: 'Volume', value: '15,700 Lac' },
          { label: 'Exchange', value: 'NSE' },
        ],
        expiries: ['09 Sep 25', '16 Sep 25', '23 Sep 25', '30 Sep 25', '07 Oct 25', '14 Oct 25'],
      };

      return {
        raw: data.data,
        formatted,
        isLive: true,
        source: 'upstox_api',
      };
    }

    throw new Error('No option chain records in response');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching Upstox option chain';
    console.warn(`[marketApi.ts] ${msg}. Using fallback OPTION_CHAIN_DATA.`);
    return {
      raw: [],
      formatted: OPTION_CHAIN_DATA,
      isLive: false,
      source: 'mock_fallback',
      error: msg,
    };
  }
}

/**
 * 2c. fetchIndexTickers()
 * Fetches live ticker indices for Nifty 50, Sensex, etc.
 * Falls back to INDICES_TICKER when offline.
 */
export async function fetchIndexTickers(): Promise<FetchTickerResult> {
  try {
    // Try fetching latest Nifty 50 daily candle for real-time benchmark check
    const result = await fetchCandles('NSE_INDEX|Nifty 50', 'day');
    if (result.isLive && result.candles.length >= 2) {
      const latest = result.candles[result.candles.length - 1];
      const prev = result.candles[result.candles.length - 2];
      const change = latest.close - prev.close;
      const changePct = (change / prev.close) * 100;

      const liveTickers: IndexTickerItem[] = INDICES_TICKER.map((item) => {
        if (item.id === 'nifty50') {
          return {
            ...item,
            value: latest.close.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}`,
            changePercent: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
            isPositive: change >= 0,
          };
        }
        return item;
      });

      return {
        data: liveTickers,
        isLive: true,
        source: 'upstox_api',
      };
    }
  } catch {
    // ignore
  }

  return {
    data: INDICES_TICKER,
    isLive: false,
    source: 'mock_fallback',
  };
}

