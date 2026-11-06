import { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Search,
  Code,
  Zap,
  TrendingUp,
  BarChart2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import dummyMarketDepthData from '../../data/dummy_market_data';
import { getMarketDepthList } from '../../services/marketDepthService';

export const MarketDepthViewer = ({ searchQuery = '', onSelectStock }) => {
  const [marketData, setMarketData] = useState(dummyMarketDepthData);
  const [selectedSymbol, setSelectedSymbol] = useState(dummyMarketDepthData[0]?.tradingSymbol || 'RELIANCE-EQ');
  const [filterQuery, setFilterQuery] = useState('');
  const [isLiveSimulating, setIsLiveSimulating] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);
  const [livePulseTick, setLivePulseTick] = useState(0);

  // Load from service or local data
  useEffect(() => {
    let isMounted = true;
    getMarketDepthList().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setMarketData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter list by internal search or prop search
  const effectiveSearch = searchQuery || filterQuery;
  const filteredList = useMemo(() => {
    if (!effectiveSearch.trim()) return marketData;
    const q = effectiveSearch.toLowerCase().trim();
    return marketData.filter(
      (item) =>
        item.tradingSymbol.toLowerCase().includes(q) ||
        item.displayName.toLowerCase().includes(q) ||
        String(item.exchangeInstrumentID).includes(q)
    );
  }, [marketData, effectiveSearch]);

  // Current active selected stock record
  const currentStock = useMemo(() => {
    return (
      marketData.find((item) => item.tradingSymbol === selectedSymbol) ||
      marketData[0] ||
      dummyMarketDepthData[0]
    );
  }, [marketData, selectedSymbol]);

  // Simulated live pulse for tick demonstration
  useEffect(() => {
    if (!isLiveSimulating) return;
    const interval = setInterval(() => {
      setLivePulseTick((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLiveSimulating]);

  // Compute depth totals and max quantities for depth bar scaling
  const { maxQty, totalBidQty, totalAskQty, spread, spreadPercent, buyRatio } = useMemo(() => {
    const bids = currentStock.bids || [];
    const asks = currentStock.asks || [];

    let bQtySum = 0;
    let aQtySum = 0;
    let maxVal = 1;

    bids.forEach((b) => {
      bQtySum += b.quantity;
      if (b.quantity > maxVal) maxVal = b.quantity;
    });

    asks.forEach((a) => {
      aQtySum += a.quantity;
      if (a.quantity > maxVal) maxVal = a.quantity;
    });

    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const sp = bestAsk > 0 && bestBid > 0 ? Number((bestAsk - bestBid).toFixed(2)) : 0;
    const spPct = bestBid > 0 ? Number(((sp / bestBid) * 100).toFixed(3)) : 0;

    const totalBuy = currentStock.totalBuyQuantity || bQtySum;
    const totalSell = currentStock.totalSellQuantity || aQtySum;
    const bRatio = totalBuy + totalSell > 0 ? Math.round((totalBuy / (totalBuy + totalSell)) * 100) : 50;

    return {
      maxQty: maxVal,
      totalBidQty: bQtySum,
      totalAskQty: aQtySum,
      spread: sp,
      spreadPercent: spPct,
      buyRatio: bRatio,
    };
  }, [currentStock]);

  return (
    <div className="space-y-3.5">
      {/* Top Banner: Standard Badge & Live Status */}
      <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-text-main">
                Market Depth (Level 2 Touchline)
              </h2>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                XTS API v2 (1502/Book 1)
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Live full 5-level order book depth, OHLC metrics, volume, and total order queue distribution.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsLiveSimulating((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
              isLiveSimulating
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-gray-100 border-gray-300 text-text-muted hover:text-text-main'
            }`}
            title="Toggle live simulated updates"
          >
            <Activity className={`w-3.5 h-3.5 ${isLiveSimulating ? 'animate-pulse text-emerald-600' : ''}`} />
            {isLiveSimulating ? 'Live Feed Active' : 'Simulation Paused'}
          </button>

          <button
            type="button"
            onClick={() => setShowRawJson((v) => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 border border-gray-300 text-text-main hover:bg-gray-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            {showRawJson ? 'Hide Raw XTS JSON' : 'Inspect Raw JSON'}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout: Stock Selector List (Left 30%) + Depth & Stats (Right 70%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[32fr_68fr] gap-3.5 items-start">
        {/* Left Column: 20 XTS Scrip Selector List */}
        <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-card-border">
            <span className="text-xs font-bold text-text-main uppercase tracking-wider">
              XTS Instruments ({filteredList.length})
            </span>
            <span className="text-[11px] text-text-muted">Segment 1 (NSE-EQ)</span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search 20 XTS stocks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-card-border rounded-lg text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Scrip List */}
          <div className="divide-y divide-card-border/50 max-h-[520px] overflow-y-auto no-scrollbar pr-0.5">
            {filteredList.map((item) => {
              const isSelected = item.tradingSymbol === currentStock.tradingSymbol;
              const isPositive = (item.percentChange || 0) >= 0;

              return (
                <div
                  key={item.exchangeInstrumentID}
                  onClick={() => setSelectedSymbol(item.tradingSymbol)}
                  className={`py-2 px-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-primary/10 border border-primary/30 shadow-xs'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-text-main truncate">
                        {item.tradingSymbol}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        #{item.exchangeInstrumentID}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-light truncate mt-0.5">
                      {item.displayName}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-text-main">
                      ₹{item.lastTradedPrice.toFixed(2)}
                    </div>
                    <div
                      className={`text-[11px] font-semibold flex items-center justify-end gap-0.5 ${
                        isPositive ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isPositive ? '+' : ''}{item.percentChange.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredList.length === 0 && (
              <div className="py-8 text-center text-xs text-text-muted">
                No instrument found matching &quot;{effectiveSearch}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Full Depth Order Book & Touchline Analytics */}
        <div className="space-y-3.5">
          {/* 1. Touchline Header Card */}
          <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-card-border pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-text-main">
                    {currentStock.displayName}
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-text-main rounded-md border border-card-border">
                    {currentStock.tradingSymbol}
                  </span>
                  <span className="text-[11px] text-text-muted font-medium">
                    NSE Cash (ID: {currentStock.exchangeInstrumentID})
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Exchange Time: {new Date(currentStock.exchangeTimestamp * 1000).toLocaleTimeString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart2 className="w-3.5 h-3.5" />
                    Book Type: {currentStock.bookType} (Market Depth)
                  </span>
                </div>
              </div>

              {/* Price & Change Pill */}
              <div className="text-right">
                <div className="text-2xl font-black text-text-main tracking-tight">
                  ₹{currentStock.lastTradedPrice.toFixed(2)}
                </div>
                <div
                  className={`text-xs font-bold mt-0.5 flex items-center justify-end gap-1 ${
                    currentStock.percentChange >= 0 ? 'text-success' : 'text-danger'
                  }`}
                >
                  {currentStock.percentChange >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {currentStock.percentChange >= 0 ? '+' : ''}
                  {currentStock.absoluteChange.toFixed(2)} ({currentStock.percentChange >= 0 ? '+' : ''}
                  {currentStock.percentChange.toFixed(2)}%)
                </div>

                {onSelectStock && (
                  <button
                    type="button"
                    onClick={() => onSelectStock(currentStock)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    <span>View Detail Page</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* OHLC & Volume Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-3.5 text-xs">
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[11px] text-text-muted block">Open</span>
                <span className="font-bold text-text-main">₹{currentStock.open.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[11px] text-text-muted block">High</span>
                <span className="font-bold text-emerald-600">₹{currentStock.high.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[11px] text-text-muted block">Low</span>
                <span className="font-bold text-rose-600">₹{currentStock.low.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[11px] text-text-muted block">Close (Prev)</span>
                <span className="font-bold text-text-main">₹{currentStock.close.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[11px] text-text-muted block">ATP (VWAP)</span>
                <span className="font-bold text-text-main">₹{currentStock.averageTradedPrice.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[11px] text-text-muted block">Volume Today</span>
                <span className="font-bold text-text-main">
                  {(currentStock.volumeTradedToday / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
          </div>

          {/* 2. Full 5-Level Market Depth Order Book */}
          <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-card-border pb-2.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-text-main">
                  5-Level Order Book Depth
                </h4>
                <span className="text-[10px] font-semibold text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                  Bid / Ask Spread: ₹{spread.toFixed(2)} ({spreadPercent}%)
                </span>
              </div>
              <div className="text-xs text-text-muted">
                LTQ: <span className="font-bold text-text-main">{currentStock.lastTradedQuantity} shares</span>
              </div>
            </div>

            {/* Depth Dual Table (Bids Left, Asks Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* BUY / BIDS TABLE */}
              <div className="border border-emerald-100 rounded-lg overflow-hidden">
                <div className="bg-emerald-50/70 px-3 py-1.5 flex items-center justify-between border-b border-emerald-100 text-xs font-bold text-emerald-800">
                  <span>BUYERS (BIDS)</span>
                  <span>5 Levels</span>
                </div>

                <div className="divide-y divide-gray-100 text-xs">
                  <div className="grid grid-cols-3 px-3 py-1 bg-gray-50/80 text-[11px] font-semibold text-text-muted">
                    <span>Orders</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Bid Price</span>
                  </div>

                  {(currentStock.bids || []).map((bid, idx) => {
                    const pct = Math.round((bid.quantity / maxQty) * 100);
                    return (
                      <div key={idx} className="relative grid grid-cols-3 px-3 py-2 items-center">
                        {/* Visual Depth Bar */}
                        <div
                          className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="relative z-10 font-medium text-text-muted">{bid.orders}</span>
                        <span className="relative z-10 text-right font-semibold text-text-main">
                          {bid.quantity.toLocaleString()}
                        </span>
                        <span className="relative z-10 text-right font-bold text-emerald-600">
                          ₹{bid.price.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal Footer */}
                <div className="bg-emerald-50/40 px-3 py-2 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Top 5 Total</span>
                  <span>{totalBidQty.toLocaleString()}</span>
                </div>
              </div>

              {/* SELL / ASKS TABLE */}
              <div className="border border-rose-100 rounded-lg overflow-hidden">
                <div className="bg-rose-50/70 px-3 py-1.5 flex items-center justify-between border-b border-rose-100 text-xs font-bold text-rose-800">
                  <span>SELLERS (ASKS)</span>
                  <span>5 Levels</span>
                </div>

                <div className="divide-y divide-gray-100 text-xs">
                  <div className="grid grid-cols-3 px-3 py-1 bg-gray-50/80 text-[11px] font-semibold text-text-muted">
                    <span>Ask Price</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Orders</span>
                  </div>

                  {(currentStock.asks || []).map((ask, idx) => {
                    const pct = Math.round((ask.quantity / maxQty) * 100);
                    return (
                      <div key={idx} className="relative grid grid-cols-3 px-3 py-2 items-center">
                        {/* Visual Depth Bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                        <span className="relative z-10 font-bold text-rose-600">
                          ₹{ask.price.toFixed(2)}
                        </span>
                        <span className="relative z-10 text-right font-semibold text-text-main">
                          {ask.quantity.toLocaleString()}
                        </span>
                        <span className="relative z-10 text-right font-medium text-text-muted">{ask.orders}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal Footer */}
                <div className="bg-rose-50/40 px-3 py-2 border-t border-rose-100 flex items-center justify-between text-xs font-bold text-rose-900">
                  <span>Top 5 Total</span>
                  <span>{totalAskQty.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Total Buy vs Total Sell Order Queue Distribution Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-emerald-700">
                  Total Buy: {(currentStock.totalBuyQuantity || 0).toLocaleString()} ({buyRatio}%)
                </span>
                <span className="text-rose-700">
                  Total Sell: {(currentStock.totalSellQuantity || 0).toLocaleString()} ({100 - buyRatio}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${buyRatio}%` }}
                  title={`Buy: ${buyRatio}%`}
                />
                <div
                  className="bg-rose-500 transition-all duration-500"
                  style={{ width: `${100 - buyRatio}%` }}
                  title={`Sell: ${100 - buyRatio}%`}
                />
              </div>
            </div>
          </div>

          {/* 3. Raw JSON Inspector (When Toggled) */}
          {showRawJson && (
            <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-xs overflow-x-auto shadow-inner border border-gray-800">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-2.5">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  Symphony Fintech XTS Market Data API v2 JSON (Book Type 1 / 1502)
                </span>
                <span className="text-[11px] text-gray-400">{currentStock.tradingSymbol}</span>
              </div>
              <pre className="text-gray-200">{JSON.stringify(currentStock, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketDepthViewer;

