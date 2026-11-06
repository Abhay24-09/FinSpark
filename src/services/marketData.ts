import { CandlestickData, Time, UTCTimestamp } from 'lightweight-charts';

/**
 * Supported Upstox candle intervals
 */
export type CandleInterval =
  | '1minute'
  | '30minute'
  | 'day'
  | 'week'
  | 'month';

/**
 * Standard candlestick structure matching TradingView Lightweight Charts
 */
export interface CandlestickPoint extends CandlestickData<Time> {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  openInterest?: number;
}

/**
 * Raw candle array structure from Upstox API v2
 * [0]: timestamp string (e.g. "2024-05-10T00:00:00+05:30")
 * [1]: open
 * [2]: high
 * [3]: low
 * [4]: close
 * [5]: volume
 * [6]: open_interest
 */
export type UpstoxRawCandle = [string, number, number, number, number, number, number];

export interface UpstoxHistoricalCandleResponse {
  status: string;
  data: {
    candles: UpstoxRawCandle[];
  };
  errors?: Array<{ errorCode: string; message: string }>;
}

export interface OptionMarketData {
  ltp: number;
  volume: number;
  oi: number;
  close_price: number;
  bid_price?: number;
  bid_qty?: number;
  ask_price?: number;
  ask_qty?: number;
  prev_oi?: number;
}

export interface OptionGreeks {
  iv?: number;
  delta?: number;
  theta?: number;
  gamma?: number;
  vega?: number;
}

export interface OptionContractDetails {
  instrument_key?: string;
  market_data?: OptionMarketData;
  option_greeks?: OptionGreeks;
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

const UPSTOX_BASE_URL = 'https://api.upstox.com/v2';

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Generates realistic fallback candlestick data for Indian market indices
 * Used for seamless local development, testing, or when Upstox API is unreachable / CORS-restricted.
 */
export function generateFallbackCandles(
  symbol: string = 'NSE_INDEX|Nifty 50',
  interval: CandleInterval | string = 'day',
  count: number = 90
): CandlestickPoint[] {
  const candles: CandlestickPoint[] = [];
  const isIntraday = interval === '1minute' || interval === '30minute';

  let currentPrice = symbol.includes('Bank') ? 51200 : symbol.includes('SENSEX') ? 81500 : 24350;
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
      // Skip weekends for daily charts
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
 * 2. API Service: fetchHistoricalCandles
 * Calls Upstox API v2 endpoint:
 * https://api.upstox.com/v2/historical-candle/{instrument_key}/{interval}/{to_date}/{from_date}
 *
 * Formats response into chronological { time, open, high, low, close }
 * matching Lightweight Charts CandlestickData format.
 */
export async function fetchHistoricalCandles(
  instrumentKey: string = 'NSE_INDEX|Nifty 50',
  interval: CandleInterval | string = 'day',
  toDate?: string,
  fromDate?: string,
  authToken?: string
): Promise<CandlestickPoint[]> {
  const targetToDate = toDate || formatDate(new Date());

  // Default fromDate to ~90 days prior if not specified
  let targetFromDate = fromDate;
  if (!targetFromDate) {
    const prior = new Date();
    prior.setDate(prior.getDate() - 90);
    targetFromDate = formatDate(prior);
  }

  const encodedKey = encodeURIComponent(instrumentKey);
  const endpoint = targetFromDate
    ? `${UPSTOX_BASE_URL}/historical-candle/${encodedKey}/${interval}/${targetToDate}/${targetFromDate}`
    : `${UPSTOX_BASE_URL}/historical-candle/${encodedKey}/${interval}/${targetToDate}`;

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Upstox API HTTP ${response.status}: ${response.statusText}`);
    }

    const json: UpstoxHistoricalCandleResponse = await response.json();

    if (json.status !== 'success' || !json.data?.candles || json.data.candles.length === 0) {
      throw new Error(json.errors?.[0]?.message || 'No candle data returned from Upstox');
    }

    // Upstox returns candles in reverse chronological order (newest first).
    // Lightweight Charts strictly requires chronological order (oldest first).
    const parsedCandles: CandlestickPoint[] = json.data.candles.map((c) => {
      const rawTimestamp = c[0];
      const isDailyOrHigher = interval === 'day' || interval === 'week' || interval === 'month';

      let timeValue: Time;
      if (isDailyOrHigher) {
        // e.g. "2024-05-10T00:00:00+05:30" -> "2024-05-10"
        timeValue = rawTimestamp.split('T')[0];
      } else {
        // Unix timestamp in seconds for intraday
        timeValue = Math.floor(new Date(rawTimestamp).getTime() / 1000) as UTCTimestamp;
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
    parsedCandles.sort((a, b) => {
      const tA = typeof a.time === 'string' ? new Date(a.time).getTime() : (a.time as number);
      const tB = typeof b.time === 'string' ? new Date(b.time).getTime() : (b.time as number);
      return tA - tB;
    });

    // Deduplicate any identical timestamps
    const uniqueMap = new Map<string | number, CandlestickPoint>();
    for (const item of parsedCandles) {
      uniqueMap.set(item.time as string | number, item);
    }

    return Array.from(uniqueMap.values());
  } catch (err) {
    console.warn(
      `[Upstox API] Could not fetch live historical candles for ${instrumentKey}. Falling back to realistic simulated data.`,
      err
    );
    return generateFallbackCandles(instrumentKey, interval, 90);
  }
}

/**
 * 2. API Service: fetchOptionChain
 * Calls Upstox API v2 option chain endpoint:
 * https://api.upstox.com/v2/option/chain?instrument_key={instrument_key}&expiry_date={expiry_date}
 */
export async function fetchOptionChain(
  instrumentKey: string = 'NSE_INDEX|Nifty 50',
  expiryDate: string = '2025-09-16',
  token?: string
): Promise<UpstoxOptionChainItem[]> {
  const url = `${UPSTOX_BASE_URL}/option/chain?instrument_key=${encodeURIComponent(
    instrumentKey
  )}&expiry_date=${expiryDate}`;

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Upstox Option Chain HTTP ${res.status}: ${res.statusText}`);
    }

    const data: UpstoxOptionChainResponse = await res.json();
    if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
      return data.data;
    }
    throw new Error('No option chain records in response');
  } catch (error) {
    console.warn(
      `[Upstox API] Could not fetch live option chain for ${instrumentKey} (${expiryDate}). Using fallback option chain.`,
      error
    );
    return generateFallbackOptionChain(instrumentKey, expiryDate);
  }
}

/**
 * Generates realistic fallback option chain data
 */
export function generateFallbackOptionChain(
  instrumentKey: string = 'NSE_INDEX|Nifty 50',
  expiryDate: string = '2025-09-16'
): UpstoxOptionChainItem[] {
  const baseSpot = instrumentKey.includes('Bank') ? 51200 : 24350;
  const step = instrumentKey.includes('Bank') ? 100 : 50;
  const centralStrike = Math.round(baseSpot / step) * step;
  const items: UpstoxOptionChainItem[] = [];

  for (let offset = -5; offset <= 5; offset++) {
    const strike = centralStrike + offset * step;
    const isCallItm = strike < baseSpot;
    const isPutItm = strike > baseSpot;

    const callDist = Math.max(0, baseSpot - strike);
    const putDist = Math.max(0, strike - baseSpot);

    const callLtp = Math.round((callDist + 80 + Math.random() * 20) * 10) / 10;
    const putLtp = Math.round((putDist + 75 + Math.random() * 20) * 10) / 10;

    items.push({
      expiry: expiryDate,
      pcr: 0.98,
      strike_price: strike,
      underlying_key: instrumentKey,
      underlying_spot_price: baseSpot,
      call_options: {
        instrument_key: `${instrumentKey}|${strike}|CE`,
        market_data: {
          ltp: isCallItm ? callLtp : Math.max(5, Math.round((120 - Math.abs(offset) * 20) * 10) / 10),
          volume: Math.floor(100000 + Math.random() * 500000),
          oi: Math.floor(1500000 + Math.random() * 3000000),
          close_price: callLtp * 0.98,
        },
        option_greeks: {
          iv: 14.5 + Math.random() * 2,
          delta: isCallItm ? 0.65 : 0.35,
          theta: -8.2,
          gamma: 0.0012,
          vega: 11.4,
        },
      },
      put_options: {
        instrument_key: `${instrumentKey}|${strike}|PE`,
        market_data: {
          ltp: isPutItm ? putLtp : Math.max(5, Math.round((115 - Math.abs(offset) * 18) * 10) / 10),
          volume: Math.floor(120000 + Math.random() * 450000),
          oi: Math.floor(1400000 + Math.random() * 2800000),
          close_price: putLtp * 1.02,
        },
        option_greeks: {
          iv: 15.1 + Math.random() * 2,
          delta: isPutItm ? -0.62 : -0.38,
          theta: -7.8,
          gamma: 0.0011,
          vega: 10.9,
        },
      },
    });
  }

  return items;
}

/**
 * Helper to produce a live simulated tick update for real-time chart streaming.
 * Passed to series.update() in TradingView Lightweight Charts.
 */
export function createSimulatedTick(lastCandle: CandlestickPoint): CandlestickPoint {
  const volatility = lastCandle.close * 0.0008;
  const delta = (Math.random() - 0.49) * volatility;
  const newClose = Math.round((lastCandle.close + delta) * 100) / 100;
  const newHigh = Math.max(lastCandle.high, newClose);
  const newLow = Math.min(lastCandle.low, newClose);

  return {
    time: lastCandle.time,
    open: lastCandle.open,
    high: newHigh,
    low: newLow,
    close: newClose,
    volume: (lastCandle.volume || 1000) + Math.floor(Math.random() * 50),
  };
}

