import dummyMarketDepthData from '../data/dummy_market_data';

/**
 * Service to retrieve Symphony Fintech XTS Market Depth data (Touchline / Book Type 1)
 * Seamlessly tries backend API first, falling back to local dummy_market_data.js.
 */

export const getMarketDepthList = async (searchQuery = '') => {
  try {
    const url = searchQuery
      ? `/api/market/depth?search=${encodeURIComponent(searchQuery)}`
      : '/api/market/depth';
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.debug('[marketDepthService] API fetch unavailable, using local dummyMarketDepthData:', err);
  }

  // Fallback to local dummyMarketDepthData
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    return dummyMarketDepthData.filter(
      (item) =>
        item.tradingSymbol.toLowerCase().includes(q) ||
        item.displayName.toLowerCase().includes(q) ||
        String(item.exchangeInstrumentID).includes(q)
    );
  }
  return dummyMarketDepthData;
};

export const getMarketDepthBySymbol = async (symbol) => {
  try {
    const res = await fetch(`/api/market/depth/${encodeURIComponent(symbol)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.debug('[marketDepthService] API fetch by symbol failed, using local dummyMarketDepthData:', err);
  }

  const clean = String(symbol).toUpperCase().trim();
  return (
    dummyMarketDepthData.find(
      (item) =>
        item.tradingSymbol.toUpperCase() === clean ||
        String(item.exchangeInstrumentID) === clean
    ) || dummyMarketDepthData[0]
  );
};

