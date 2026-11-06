/**
 * Service client for NSE Bhavcopy (CM-UDiFF) Market Data API
 */

export interface BhavcopyStock {
  symbol: string;
  name: string;
  isin: string;
  series: string;
  tradingDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  lastPrice: number;
  settlementPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  tradedValue: number;
  trades: number;
  vwap: number;
  deliverableQty: number | null;
  segment?: string;
  instrumentType?: string;
}

export interface BhavcopySummary {
  tradingDate: string;
  totalStocks: number;
  advancers: number;
  decliners: number;
  unchanged: number;
  top10Gainers: BhavcopyStock[];
  top10Losers: BhavcopyStock[];
  highestVolume: BhavcopyStock[];
  highestValue: BhavcopyStock[];
  source: string;
  lastUpdated: string;
}

export interface BhavcopyListResponse {
  success: boolean;
  tradingDate: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  series: string;
  data: BhavcopyStock[];
  metadata?: {
    source: string;
    fileName: string;
    retrievedAt: string;
    deliverableQuantityAvailable: boolean;
    deliverableQuantityNote: string;
  };
}

export interface BhavcopyQueryParams {
  date?: string;
  series?: string;
  search?: string;
  page?: number;
  limit?: number | 'all';
  sort?: string;
  order?: 'asc' | 'desc';
}

const API_BASE = '/api/market/bhavcopy';

/**
 * Fetch paginated Bhavcopy stocks list
 */
export async function fetchBhavcopyStocks(
  params: BhavcopyQueryParams = {}
): Promise<BhavcopyListResponse> {
  const query = new URLSearchParams();

  if (params.date) query.set('date', params.date);
  if (params.series) query.set('series', params.series);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.sort) query.set('sort', params.sort);
  if (params.order) query.set('order', params.order);

  const url = `${API_BASE}?${query.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}: Failed to fetch Bhavcopy stocks`);
  }

  return res.json();
}

/**
 * Fetch Market Overview summary (advancers, decliners, top 10 gainers/losers/volume)
 */
export async function fetchBhavcopySummary(date?: string): Promise<{
  success: boolean;
  summary: BhavcopySummary;
}> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`${API_BASE}/summary${query}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}: Failed to fetch market summary`);
  }

  return res.json();
}

/**
 * Fetch specific stock details by symbol
 */
export async function fetchBhavcopyStock(
  symbol: string,
  date?: string
): Promise<{ success: boolean; data: BhavcopyStock; tradingDate: string }> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`${API_BASE}/${encodeURIComponent(symbol)}${query}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}: Failed to fetch stock ${symbol}`);
  }

  return res.json();
}

/**
 * Trigger manual refresh
 */
export async function refreshBhavcopy(): Promise<{
  success: boolean;
  message: string;
  tradingDate: string;
  summary: BhavcopySummary;
}> {
  const res = await fetch(`${API_BASE}/refresh`, { method: 'POST' });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to refresh Bhavcopy data');
  }

  return res.json();
}

/**
 * Format Indian Currency / Values (e.g. ₹1,234.56 Cr, ₹45.20 L, ₹85,000)
 */
export function formatIndianCurrency(val: number): string {
  if (!val || isNaN(val)) return '₹0.00';
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format volume in Indian numbering system
 */
export function formatIndianNumber(num: number): string {
  if (!num || isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

