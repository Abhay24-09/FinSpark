import { useState, useMemo, useEffect } from 'react';
import StockHeader from './StockHeader';
import MarketDepthCard from './MarketDepthCard';
import PositionsCard from './PositionsCard';
import MarketTodaySection from './MarketTodaySection';
import TechnicalsSection from './TechnicalsSection';
import FundamentalsSection from './FundamentalsSection';
import FnoSection from './FnoSection';
import OptionChainSection from './OptionChainSection';
import RightOrderPanel from './RightOrderPanel';
import TradingChart from '../TradingChart';
import dummyMarketDepthData from '../../data/dummy_market_data';
import { ChevronUp, ChevronDown } from 'lucide-react';

const SUB_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'technicals', label: 'Technicals' },
  { id: 'fundamentals', label: 'Fundamentals' },
  { id: 'fno', label: 'FnO' },
  { id: 'option_chain', label: 'Option Chain' },
  { id: 'news', label: 'News' },
];

const FIGMA_RELIANCE_POWER = {
  displayName: 'Reliance Power',
  tradingSymbol: 'RPOWER-EQ',
  exchange: 'NSE',
  lastTradedPrice: 67.54,
  absoluteChange: -1.08,
  percentChange: -1.58,
  open: 68.20,
  high: 69.40,
  low: 66.80,
  close: 68.62,
  volumeTradedToday: 12450890,
  totalBuyQuantity: 33275045,
  totalSellQuantity: 57875307,
  bids: [
    { price: 158.61, orders: 12, quantity: 2250268 },
    { price: 158.30, orders: 12, quantity: 4658800 },
    { price: 158.12, orders: 12, quantity: 2050349 },
    { price: 158.00, orders: 12, quantity: 1528447 },
    { price: 157.55, orders: 12, quantity: 4830613 },
  ],
  asks: [
    { price: 159.07, orders: 123, quantity: 2250268 },
    { price: 159.18, orders: 123, quantity: 4658800 },
    { price: 159.27, orders: 123, quantity: 2050349 },
    { price: 158.12, orders: 123, quantity: 1528447 },
    { price: 158.08, orders: 123, quantity: 4830613 },
  ],
};

const FIGMA_RELIANCE_POWER_BSE = {
  displayName: 'Reliance Power',
  tradingSymbol: 'RPOWER',
  bseScripCode: '532939',
  exchange: 'BSE',
  exchangeSegment: 11,
  lastTradedPrice: 67.45,
  absoluteChange: -1.17,
  percentChange: -1.70,
  open: 68.10,
  high: 69.25,
  low: 66.70,
  close: 68.62,
  averageTradedPrice: 67.85,
  volumeTradedToday: 3812400,
  totalBuyQuantity: 11245600,
  totalSellQuantity: 18450200,
  bids: [
    { price: 158.45, orders: 9, quantity: 840200 },
    { price: 158.20, orders: 16, quantity: 1540300 },
    { price: 158.05, orders: 24, quantity: 980140 },
    { price: 157.90, orders: 31, quantity: 740120 },
    { price: 157.40, orders: 48, quantity: 2100450 },
  ],
  asks: [
    { price: 158.95, orders: 74, quantity: 940250 },
    { price: 159.10, orders: 86, quantity: 1820400 },
    { price: 159.20, orders: 98, quantity: 1120300 },
    { price: 159.35, orders: 112, quantity: 890450 },
    { price: 159.50, orders: 140, quantity: 2450800 },
  ],
};

const createBseStockData = (nseStock) => {
  if (!nseStock) return FIGMA_RELIANCE_POWER_BSE;
  const ltp = typeof nseStock.lastTradedPrice === 'number' ? nseStock.lastTradedPrice : 100;
  const bseLtp = Number((ltp * 0.9985).toFixed(2));
  const change = typeof nseStock.absoluteChange === 'number' ? nseStock.absoluteChange : 0;
  const bseChange = Number((change - (ltp - bseLtp)).toFixed(2));
  const close = typeof nseStock.close === 'number' ? nseStock.close : ltp;
  const bseChangePct = close > 0 ? Number(((bseChange / close) * 100).toFixed(2)) : nseStock.percentChange;
  const vol = typeof nseStock.volumeTradedToday === 'number' ? nseStock.volumeTradedToday : 1000000;
  const bseVol = Math.round(vol * 0.32);
  const buyQty = typeof nseStock.totalBuyQuantity === 'number' ? nseStock.totalBuyQuantity : 300000;
  const sellQty = typeof nseStock.totalSellQuantity === 'number' ? nseStock.totalSellQuantity : 350000;

  const rawSymbol = nseStock.tradingSymbol || nseStock.symbol || '';
  const cleanSymbol = rawSymbol.replace('-EQ', '');

  return {
    ...nseStock,
    exchange: 'BSE',
    exchangeSegment: 11,
    tradingSymbol: cleanSymbol,
    lastTradedPrice: bseLtp,
    absoluteChange: bseChange,
    percentChange: bseChangePct,
    open: Number((bseLtp * 0.998).toFixed(2)),
    high: Number((bseLtp * 1.015).toFixed(2)),
    low: Number((bseLtp * 0.982).toFixed(2)),
    close,
    volumeTradedToday: bseVol,
    totalBuyQuantity: Math.round(buyQty * 0.35),
    totalSellQuantity: Math.round(sellQty * 0.38),
    bids: Array.isArray(nseStock.bids)
      ? nseStock.bids.map((b) => ({
          price: Number((b.price * 0.9985).toFixed(2)),
          orders: Math.max(1, Math.round(b.orders * 0.6)),
          quantity: Math.round(b.quantity * 0.35),
        }))
      : [],
    asks: Array.isArray(nseStock.asks)
      ? nseStock.asks.map((a) => ({
          price: Number((a.price * 0.9985).toFixed(2)),
          orders: Math.max(1, Math.round(a.orders * 0.6)),
          quantity: Math.round(a.quantity * 0.35),
        }))
      : [],
  };
};

/**
 * StockDetailPage
 * ---------------------------------------------------------------------------
 * Full Stock Detail Page matching the Figma Turbo Web UI:
 * - Stock Header (Name, Segments, Live Price, Buy/Sell, Bookmark)
 * - Left (70%): TradingView Chart + Navigation Subtabs + Market Today
 * - Right (30%): Market Depth 5-Level Book + Positions/Holdings/Orders
 * - Interactive Order Modal for Buy/Sell execution
 */
export const StockDetailPage = ({
  stock = null,
  onBack,
  onOrderPlaced,
}) => {
  const [selectedExchange, setSelectedExchange] = useState(
    stock?.exchange === 'BSE' ? 'BSE' : 'NSE'
  );

  // Sync selectedExchange when a stock with specific exchange is provided
  useEffect(() => {
    if (stock?.exchange && (stock.exchange === 'NSE' || stock.exchange === 'BSE')) {
      setSelectedExchange(stock.exchange);
    }
  }, [stock?.exchange, stock?.symbol, stock?.tradingSymbol]);

  // Resolve stock data or fallback to exact Figma Reliance Power specification
  const currentStock = useMemo(() => {
    let baseNse = null;

    if (!stock) {
      baseNse = FIGMA_RELIANCE_POWER;
    } else if (typeof stock === 'string') {
      const query = stock.trim().toLowerCase();
      if (query.includes('power') || query === 'rpower' || query === 'rpower-eq') {
        baseNse = FIGMA_RELIANCE_POWER;
      } else {
        const matched = dummyMarketDepthData.find(
          (d) =>
            d.tradingSymbol.toLowerCase() === query ||
            d.tradingSymbol.toLowerCase().replace('-eq', '') === query ||
            d.displayName.toLowerCase() === query ||
            d.displayName.toLowerCase().includes(query)
        );
        if (matched) {
          baseNse = matched;
        } else {
          baseNse = {
            ...dummyMarketDepthData[0],
            displayName: stock.replace('-EQ', '').toUpperCase(),
            tradingSymbol: stock.toUpperCase().endsWith('-EQ') ? stock.toUpperCase() : `${stock.toUpperCase()}-EQ`,
          };
        }
      }
    } else {
      const stockName = stock.name || stock.displayName || stock.title || '';
      const symbol = stock.symbol || stock.tradingSymbol || '';

      if (
        stockName.toLowerCase().includes('power') ||
        symbol.toLowerCase().includes('rpower')
      ) {
        baseNse = FIGMA_RELIANCE_POWER;
      } else if (stock.bids && stock.asks) {
        baseNse = stock;
      } else {
        const matched = dummyMarketDepthData.find(
          (d) =>
            (symbol && d.tradingSymbol.toLowerCase() === symbol.toLowerCase()) ||
            (symbol && d.tradingSymbol.toLowerCase().includes(symbol.toLowerCase())) ||
            (symbol && symbol.toLowerCase().includes(d.tradingSymbol.replace('-EQ', '').toLowerCase())) ||
            (stockName && d.displayName.toLowerCase().includes(stockName.toLowerCase())) ||
            (stockName && stockName.toLowerCase().includes(d.displayName.toLowerCase()))
        );
        if (matched) {
          baseNse = matched;
        } else {
          const parsedPrice = parseFloat(String(stock.price || stock.ltp || '67.54').replace(/[^0-9.]/g, '')) || 67.54;
          const parsedChange = parseFloat(String(stock.change || '-1.08').replace(/[^0-9.-]/g, '')) || -1.08;
          const parsedPct = parseFloat(String(stock.changePercent || '-1.58').replace(/[^0-9.-]/g, '')) || -1.58;

          baseNse = {
            ...dummyMarketDepthData[0],
            displayName: stockName || 'Reliance Power',
            tradingSymbol: symbol ? (symbol.endsWith('-EQ') ? symbol : `${symbol}-EQ`) : `${stockName.toUpperCase().replace(/\s+/g, '')}-EQ`,
            lastTradedPrice: parsedPrice,
            absoluteChange: parsedChange,
            percentChange: parsedPct,
            close: Number((parsedPrice - parsedChange).toFixed(2)),
            open: parsedPrice,
            high: Number((parsedPrice * 1.02).toFixed(2)),
            low: Number((parsedPrice * 0.98).toFixed(2)),
          };
        }
      }
    }

    const nseRecord = {
      ...baseNse,
      exchange: 'NSE',
    };

    if (selectedExchange === 'BSE') {
      const isRelPower =
        nseRecord.displayName?.toLowerCase().includes('power') ||
        nseRecord.tradingSymbol?.toLowerCase().includes('rpower');
      return isRelPower ? FIGMA_RELIANCE_POWER_BSE : createBseStockData(nseRecord);
    }

    return nseRecord;
  }, [stock, selectedExchange]);

  // Safe numerical metrics
  const ltp = typeof currentStock?.lastTradedPrice === 'number' ? currentStock.lastTradedPrice : 67.54;
  const low = typeof currentStock?.low === 'number' ? currentStock.low : Number((ltp * 0.985).toFixed(2));
  const high = typeof currentStock?.high === 'number' ? currentStock.high : Number((ltp * 1.018).toFixed(2));

  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [orderModalState, setOrderModalState] = useState({ isOpen: false, action: 'BUY' });

  // User simulated positions and orders state
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);

  // Handle order submission from modal
  const handleOrderSubmit = (newOrder) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Update positions
    setPositions((prev) => {
      const existing = prev.find((p) => p.symbol === newOrder.symbol);
      const isSell = newOrder.action === 'SELL';
      const orderQty = newOrder.qty || 0;

      if (existing) {
        const updatedQty = isSell ? existing.qty - orderQty : existing.qty + orderQty;
        return prev.map((p) =>
          p.symbol === newOrder.symbol
            ? { ...p, qty: updatedQty, pnl: 0 }
            : p
        );
      }
      return [
        {
          symbol: newOrder.symbol,
          qty: isSell ? -orderQty : orderQty,
          avgPrice: newOrder.price,
          type: newOrder.productType,
          pnl: 0,
        },
        ...prev,
      ];
    });

    if (onOrderPlaced) {
      onOrderPlaced(newOrder);
    }
  };

  const currentStockHoldings = Math.max(
    0,
    positions
      .filter((p) => (p.symbol === currentStock?.tradingSymbol || p.symbol === currentStock?.symbol || p.symbol === 'RPOWER-EQ') && (p.type === 'LONG-TERM' || p.type === 'Long-term'))
      .reduce((sum, p) => sum + (p.qty || 0), 0)
  );

  return (
    <div className="space-y-3 pb-8">
      {/* 1. Top Stock Header (Title, Exchange Badges, Price, Buy/Sell, Quick Actions) */}
      <StockHeader
        stock={currentStock}
        selectedExchange={selectedExchange}
        onExchangeChange={setSelectedExchange}
        onBack={onBack}
        onBuyClick={() =>
          setOrderModalState((prev) =>
            prev.isOpen && prev.action === 'BUY'
              ? { isOpen: false, action: 'BUY' }
              : { isOpen: true, action: 'BUY' }
          )
        }
        onSellClick={() =>
          setOrderModalState((prev) =>
            prev.isOpen && prev.action === 'SELL'
              ? { isOpen: false, action: 'SELL' }
              : { isOpen: true, action: 'SELL' }
          )
        }
        onOpenOptionChain={() => {
          setActiveSubTab('option_chain');
          setIsExpanded(false);
        }}
      />

      {/* 2. Main Two-Column Layout matching Figma UI */}
      <div className="grid grid-cols-1 lg:grid-cols-[70fr_30fr] gap-3.5 items-start">
        {/* Left Column (70%): TradingView Chart & Tabbed Analytics */}
        <div className="space-y-3 min-w-0">
          {/* TradingView Candlestick Chart */}
          <TradingChart
            key={`trading-chart-${currentStock.tradingSymbol}-${selectedExchange}`}
            instrumentKey={`${selectedExchange}_EQ|${currentStock.tradingSymbol}`}
            exchange={selectedExchange}
            stock={currentStock}
            basePrice={currentStock.lastTradedPrice}
            interval="day"
            height={isExpanded ? 585 : 440}
            theme="light"
            showToolbar={true}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded((prev) => !prev)}
          />

          {/* Sub-Tabs Bar: Overview | Technicals | Fundamentals | FnO | Option Chain | News */}
          <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs px-4 py-2 flex items-center justify-between overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-6">
              {SUB_TABS.map((tab) => {
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveSubTab(tab.id);
                      setIsExpanded(false);
                    }}
                    className={`relative py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      isActive ? 'text-[#603DC8] font-bold' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#603DC8] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Collapse / Restore Toggle Button matching Figma */}
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 ml-4 cursor-pointer transition-colors shrink-0 select-none py-1 px-2 rounded-md hover:bg-gray-100"
              title={isExpanded ? 'Restore analytics panel' : 'Collapse analytics panel & expand chart'}
            >
              {isExpanded ? (
                <>
                  <span>Restore</span>
                  <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                </>
              ) : (
                <>
                  <span>Collapse</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </>
              )}
            </button>
          </div>

          {/* Tab Content Display */}
          {!isExpanded && (
            <div>
              {/* Tab 1: Overview (Market Today with Low/High sliders) */}
              {activeSubTab === 'overview' && (
                <MarketTodaySection stockData={currentStock} />
              )}

              {/* Tab 2: Technicals (Pivot Levels & R1-R3 / S1-S3) */}
              {activeSubTab === 'technicals' && (
                <TechnicalsSection stockData={currentStock} />
              )}

              {/* Tab 3: Fundamentals (Key Stats & Valuation P/E, P/B) */}
              {activeSubTab === 'fundamentals' && (
                <FundamentalsSection stockData={currentStock} />
              )}

              {/* Tab 4: FnO (Futures & Options Side-by-Side) */}
              {activeSubTab === 'fno' && (
                <FnoSection stockData={currentStock} />
              )}

              {/* Tab 5: Option Chain (Expiry Pills, Calls vs Puts & Strike/PCR Table) */}
              {activeSubTab === 'option_chain' && (
                <OptionChainSection stockData={currentStock} />
              )}

              {/* Tab 6: News */}
              {activeSubTab === 'news' && (
                <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs p-4 space-y-3 text-xs">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5">
                    Latest Market Announcements & News
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/60">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                        <span className="font-bold text-[#603DC8]">Exchange Filing</span>
                        <span>2 hours ago</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs">
                        {currentStock.displayName} announces board meeting to review Q2 financial performance.
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        The board of directors is scheduled to meet on Friday to consider quarterly audited financial statements and dividend proposals.
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/60">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                        <span className="font-bold text-emerald-700">Sector Outlook</span>
                        <span>5 hours ago</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs">
                        Institutional brokerage raises price target on strong operating cash flows.
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        Analysts cite margin resilience, aggressive market share acquisition, and debt reduction initiatives.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (30%): Market Depth + Positions (Always visible in layout) */}
        <div className="space-y-3 min-w-0">
          {/* 1. Market Depth Card (Figma 1:1 Match) */}
          <MarketDepthCard data={currentStock} />

          {/* 2. Positions, Holdings & Orders Card (Figma 1:1 Match) */}
          <PositionsCard
            positions={positions}
            orders={orders}
            onOpenOrderModal={(act) => setOrderModalState({ isOpen: true, action: act })}
          />
        </div>
      </div>

      {/* Dedicated Full-Screen / Full-Height Right-Side Order Execution Window (Figma 1:1 Match) */}
      {orderModalState.isOpen && (
        <RightOrderPanel
          stock={{ ...currentStock, holdingQty: currentStockHoldings }}
          action={orderModalState.action}
          initialProductType={orderModalState.productType || 'Long-term'}
          onClose={() => setOrderModalState((prev) => ({ ...prev, isOpen: false }))}
          onSubmitOrder={handleOrderSubmit}
        />
      )}
    </div>
  );
};

export default StockDetailPage;
