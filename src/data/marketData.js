// Comprehensive market mock data matching Symphony Fintech XTS & Figma Turbo Web UI
import dummyMarketDepthData from './dummy_market_data.js';

const formatINR = (val) => {
  if (typeof val !== 'number') return String(val);
  const parts = val.toFixed(2).split('.');
  const integer = parts[0];
  if (integer.length <= 3) return `${integer}.${parts[1]}`;
  const last3 = integer.substring(integer.length - 3);
  const other = integer.substring(0, integer.length - 3);
  const formattedOther = other.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${formattedOther},${last3}.${parts[1]}`;
};

const formatINRInt = (val) => {
  const integer = String(Math.round(val));
  if (integer.length <= 3) return integer;
  const last3 = integer.substring(integer.length - 3);
  const other = integer.substring(0, integer.length - 3);
  const formattedOther = other.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${formattedOther},${last3}`;
};

export const INDICES_TICKER = [
  { id: 'nifty50', name: 'NIFTY 50', value: '22,020.40', change: '+73.90', changePercent: '+0.33%', isPositive: true },
  { id: 'sensex', name: 'SENSEX', value: '72,626.40', change: '+73.90', changePercent: '+0.10%', isPositive: true },
  { id: 'niftybank', name: 'NIFTY BANK', value: '46,890.20', change: '-112.40', changePercent: '-0.24%', isPositive: false },
  { id: 'finnifty', name: 'FINNIFTY', value: '20,845.30', change: '+45.20', changePercent: '+0.22%', isPositive: true },
  { id: 'niftymidselect', name: 'NIFTY MID SELECT', value: '10,920.40', change: '+38.15', changePercent: '+0.35%', isPositive: true },
  { id: 'niftymidcap', name: 'NIFTY MIDCAP', value: '48,310.60', change: '+180.25', changePercent: '+0.38%', isPositive: true },
  { id: 'nifty100', name: 'NIFTY 100', value: '22,810.15', change: '+68.45', changePercent: '+0.30%', isPositive: true },
  { id: 'niftyit', name: 'NIFTY IT', value: '36,920.80', change: '-185.60', changePercent: '-0.50%', isPositive: false },
];

export const INDEX_OPTIONS = [
  { id: 'nifty_50', name: 'NIFTY 50', exchange: 'NSE' },
  { id: 'nifty_100', name: 'NIFTY 100', exchange: 'NSE' },
  { id: 'nifty_500', name: 'NIFTY 500', exchange: 'NSE' },
  { id: 'bse_100', name: 'BSE 100', exchange: 'BSE' },
  { id: 'bse_200', name: 'BSE 200', exchange: 'BSE' },
];

export const BUSINESS_GROUPS = [
  { id: 'tata', name: 'Tata', logoKey: 'tata' },
  { id: 'adani', name: 'Adani', logoKey: 'adani' },
  { id: 'mahindra', name: 'Mahindra', logoKey: 'mahindra' },
  { id: 'bajaj', name: 'Bajaj', logoKey: 'bajaj' },
  { id: 'aditya_birla', name: 'Aditya Bir...', fullName: 'Aditya Birla', logoKey: 'aditya_birla' },
  { id: 'reliance', name: 'Reliance', logoKey: 'reliance' },
];

export const COLLECTIONS = [
  {
    id: 'under-250',
    title: 'Under ₹250',
    description: 'Invest in pocket friendly scrips with prices under ₹250 rupees.',
    iconKey: 'wallet',
  },
  {
    id: 'renewable-energy',
    title: 'Renewable Energy',
    description: 'Put your money in the renewable energy sector to promote sustainable energy solutions.',
    iconKey: 'zap',
  },
  {
    id: 'top-25',
    title: 'Top 25',
    description: 'A curated list of the top 25 companies impacting the Indian economy',
    iconKey: 'trophy',
  },
  {
    id: 'dividend-yields',
    title: 'Dividend Yields',
    description: 'Invest in companies offering regular dividend payouts',
    iconKey: 'percent',
  },
  {
    id: 'clean-green',
    title: 'Renewable Energy',
    description: 'Put your money in the renewable energy sector to promote sustainable energy solutions.',
    iconKey: 'leaf',
  },
];

export const NET_FLOW_DATA = {
  title: 'Net Flow (+ 1000 Cr)',
  date: '20 May 2025',
  duration: '1 Day',
  exchange: 'NSE',
  fii: { label: 'FII', amount: '+ ₹1,246.50 Cr', isPositive: true },
  dii: { label: 'DII', amount: '+ ₹1,246.50 Cr', isPositive: true },
};

export const EXPERTS_PICKS = [
  {
    id: 'reliance',
    name: 'Reliance Industries',
    exchange: 'NSE',
    price: '₹2,984.50',
    change: '+23.70',
    changePercent: '+0.80%',
    isPositive: true,
    enterAt: '2,960.00',
    stopLoss: '2,940.00',
    maxProfit: '₹3,050.00',
    action: 'BUY',
  },
  {
    id: 'tcs',
    name: 'Tata Consultancy Services',
    exchange: 'NSE',
    price: '₹4,125.75',
    change: '+23.65',
    changePercent: '+0.58%',
    isPositive: true,
    enterAt: '4,100.00',
    stopLoss: '4,070.00',
    maxProfit: '₹4,220.00',
    action: 'BUY',
  },
];

export const STOCK_DATA = dummyMarketDepthData.map((d, index) => {
  // If the stock is below today's opening price, show in red (isPositive: false), otherwise green (isPositive: true)
  const isPositive = d.open !== undefined ? d.lastTradedPrice >= d.open : d.absoluteChange >= 0;
  const changeSign = d.absoluteChange >= 0 ? '+' : '';
  const cleanSymbol = d.tradingSymbol.replace('-EQ', '');

  const categories = isPositive ? ['top_gainers'] : ['top_losers'];
  if (d.volumeTradedToday >= 3000000) categories.push('by_volume');
  if (d.lastTradedPrice * d.volumeTradedToday >= 4000000000) categories.push('by_value');
  if (d.percentChange >= 0.9) categories.push('high_returns');

  return {
    id: d.tradingSymbol.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: d.displayName,
    symbol: cleanSymbol,
    exchange: 'NSE',
    price: `₹${formatINR(d.lastTradedPrice)}`,
    lastTradedPrice: d.lastTradedPrice,
    open: d.open,
    openFormatted: `₹${formatINR(d.open)}`,
    change: `${changeSign}${d.absoluteChange.toFixed(2)}`,
    changePercent: `${changeSign}${d.percentChange.toFixed(2)}%`,
    isPositive,
    category: categories,
    index: 'nifty_50',
    logo: cleanSymbol.toLowerCase(),
    badge: index === 3 ? 'MTF 2.5X' : (index === 7 ? 'MTF 4X' : undefined),
    tradingSymbol: d.tradingSymbol,
  };
});

export const SECTOR_HEATMAP = {
  sectors: [
    { name: 'Financial Services', change: '-0.25%', colSpan: 'col-span-2', bg: 'bg-[#D6BBFB]/60 text-purple-900' },
    { name: 'IT', change: '0.28%', colSpan: 'col-span-1', bg: 'bg-[#BDB4FE] text-purple-950' },
    { name: 'FMCG', change: '0.28%', colSpan: 'col-span-3', bg: 'bg-[#603DC8] text-white' },
    { name: 'IT', change: '0.28%', colSpan: 'col-span-1', bg: 'bg-[#C7D7FE] text-indigo-950' },
    { name: 'Metal', change: '0.08%', colSpan: 'col-span-3', bg: 'bg-gray-200 text-gray-800' },
    { name: 'Auto', change: '0.28%', colSpan: 'col-span-1', bg: 'bg-[#BDB4FE] text-purple-950' },
    { name: 'Realty', change: '-1.2%', colSpan: 'col-span-1', bg: 'bg-gray-300 text-gray-800' },
    { name: 'Energy', change: '0.28%', colSpan: 'col-span-1', bg: 'bg-[#D6BBFB]/60 text-purple-900' },
    { name: 'Consumer', change: '1.17%', colSpan: 'col-span-4', bg: 'bg-[#603DC8] text-white' },
    { name: 'FMCG', change: '-1.2%', colSpan: 'col-span-1', bg: 'bg-gray-300 text-gray-800' },
  ],
  legend: [
    { label: '< -2%', color: 'bg-gray-400' },
    { label: '-2%', color: 'bg-gray-300' },
    { label: '-1%', color: 'bg-gray-200' },
    { label: '+1%', color: 'bg-[#D6BBFB]' },
    { label: '+2%', color: 'bg-[#7C59DF]' },
    { label: '> +2%', color: 'bg-[#603DC8]' },
  ],
};

export const SECTOR_CHIPS = [
  'Banking and Finance',
  'FMCG',
  'Utilities',
  'Oil & Gas',
  'Automobile',
  'Construction',
  'Metal and Mining',
  'General Industries',
  'Diversified Consumer Service',
  'Transportation',
  'Food & Beverages',
  'Pharmaceuticals',
];

export const NEWS_TABS = [
  { id: 'market', label: 'Market' },
  { id: 'corporate', label: 'Corporate Actions' },
  { id: 'ipo', label: 'IPO' },
  { id: 'watchlist', label: 'In Watchlist' },
  { id: 'portfolio', label: 'In Portfolio' },
];

export const NEWS_ITEMS = [
  {
    id: 1,
    category: 'market',
    date: "Jul 10'25, 10:00 AM",
    title: 'GLEN Industries NFO allotment today: check status, latest GMP, listing date',
    description: 'Once the allotment of GLEN Industries IPO shares is finalised, investors can change their status on the...',
  },
  {
    id: 2,
    category: 'market',
    date: "Jul 10'25, 10:00 AM",
    title: 'RBI Closely Monitoring global crypto moves as India mulls policy papger',
    description: "The Reserve Bank of India is closely monitoring global crypto developments, especially with Donald Trump's...",
  },
  {
    id: 3,
    category: 'market',
    date: "Jul 10'25, 10:00 AM",
    title: 'Monetary Policy updates: Repo Rate projected to remain steady in Q2 review',
    description: 'Markets expect the central monetary committee to balance growth signals with inflationary expectations...',
  },
];

export const KNOWLEDGE_ITEMS = [
  {
    id: 1,
    title: 'What are the Risks of Investing?',
    theme: 'purple',
    gradient: 'from-[#603DC8] to-[#452A93]',
    bannerBg: 'bg-[#603DC8]',
  },
  {
    id: 2,
    title: 'Why Invest in Stocks? Why it matters ?',
    theme: 'blue',
    gradient: 'from-[#0BA5EC] to-[#0086C9]',
    bannerBg: 'bg-[#0086C9]',
  },
  {
    id: 3,
    title: 'How to Start your first Stock investment today',
    theme: 'green',
    gradient: 'from-[#12B76A] to-[#027A48]',
    bannerBg: 'bg-[#027A48]',
  },
  {
    id: 4,
    title: 'What is IPO & How to Apply for allotment?',
    theme: 'amber',
    gradient: 'from-[#F79009] to-[#B54708]',
    bannerBg: 'bg-[#B54708]',
  },
];

export const MARKET_MOVERS_TABLE_DATA = dummyMarketDepthData.map((d, index) => {
  // If the stock is below today's opening price, show in red (isPositive: false), otherwise green (isPositive: true)
  const isPositive = d.open !== undefined ? d.lastTradedPrice >= d.open : d.absoluteChange >= 0;
  const changeSign = d.absoluteChange >= 0 ? '+ ' : '- ';
  const cleanSymbol = d.tradingSymbol.replace('-EQ', '');

  const categories = isPositive ? ['top_gainers'] : ['top_losers'];
  if (d.volumeTradedToday >= 3000000) categories.push('by_volume');
  if (d.lastTradedPrice * d.volumeTradedToday >= 4000000000) categories.push('by_value');
  if (d.percentChange >= 0.9) categories.push('high_returns');

  return {
    id: d.tradingSymbol.toLowerCase().replace(/[^a-z0-9]/g, ''),
    name: d.displayName,
    exchange: 'NSE',
    symbol: cleanSymbol,
    tradingSymbol: d.tradingSymbol,
    volume: formatINRInt(d.volumeTradedToday),
    volumeRaw: d.volumeTradedToday,
    ltp: `₹ ${formatINR(d.lastTradedPrice)}`,
    ltpRaw: d.lastTradedPrice,
    change: `${changeSign}₹${Math.abs(d.absoluteChange).toFixed(2)}`,
    changePercent: `${changeSign}${Math.abs(d.percentChange).toFixed(2)}%`,
    changePercentRaw: d.percentChange,
    open: `₹ ${formatINR(d.open)}`,
    openRaw: d.open,
    prevClose: `₹${formatINR(d.close)}`,
    isPositive,
    category: categories,
    index: 'nifty_50',
    isHighlighted: index === 0,
  };
});
