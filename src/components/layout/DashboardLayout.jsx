import { useState, useEffect, useCallback } from 'react';
import TickerBar from './TickerBar';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MarketMovers from '../dashboard/MarketMovers';
import MarketMoversDetail from '../dashboard/MarketMoversDetail';
import StocksBySectorDetail from '../dashboard/StocksBySectorDetail';
import CollectionsDetail from '../dashboard/CollectionsDetail';
import BusinessGroupDetail from '../dashboard/BusinessGroupDetail';
import BusinessGroups from '../dashboard/BusinessGroups';
import Collections from '../dashboard/Collections';
import NetFlowCard from '../dashboard/NetFlowCard';
import ExpertsPick from '../dashboard/ExpertsPick';
import PromoBanners from '../dashboard/PromoBanners';
import SectorHeatmap from '../dashboard/SectorHeatmap';
import StocksBySectors from '../dashboard/StocksBySectors';
import NewsUpdates from '../dashboard/NewsUpdates';
import KnowledgeCentre from '../dashboard/KnowledgeCentre';
import FnoLandingPage from '../fno/FnoLandingPage';
import CommodityLandingPage from '../commodity/CommodityLandingPage';
import BhavcopyDashboard from '../bhavcopy/BhavcopyDashboard';
import TradingChart from '../TradingChart';
import OptionsDataViewer from '../OptionsDataViewer';
import MarketDepthViewer from '../dashboard/MarketDepthViewer';
import StockDetailPage from '../stock-detail/StockDetailPage';
import ErrorBoundary from '../common/ErrorBoundary';
import dummyMarketDepthData from '../../data/dummy_market_data';
import { STOCK_DATA } from '../../data/marketData';
import HoldingsDashboard from '../dashboard/HoldingsDashboard';
import PositionsDashboard from '../dashboard/PositionsDashboard';
import WatchlistDashboard from '../dashboard/WatchlistDashboard';
import OrdersDashboard from '../dashboard/OrdersDashboard';
import {
  INITIAL_HOLDINGS,
  INITIAL_POSITIONS,
  INITIAL_WATCHLISTS,
  INITIAL_ORDERS,
} from '../../data/portfolioData';

const MAIN_CATEGORY_TABS = [
  { id: 'stocks', label: 'Stocks' },
  { id: 'fno', label: 'F&O' },
  { id: 'commodity', label: 'Commodity' },
];

/**
 * Resolves any raw symbol or identifier into a full stock record
 */
const resolveStockBySymbol = (raw) => {
  if (!raw) {
    return {
      displayName: 'Reliance Power',
      tradingSymbol: 'RPOWER-EQ',
      lastTradedPrice: 67.54,
      open: 68.62,
      openPrice: 68.62,
      close: 68.62,
      absoluteChange: -1.08,
      percentChange: -1.58,
    };
  }
  const decoded = decodeURIComponent(raw).trim().toLowerCase();

  // Special match for Figma prototype Reliance Power
  if (decoded.includes('power') || decoded === 'rpower' || decoded === 'rpower-eq') {
    return {
      displayName: 'Reliance Power',
      tradingSymbol: 'RPOWER-EQ',
      lastTradedPrice: 67.54,
      open: 68.62,
      openPrice: 68.62,
      close: 68.62,
      absoluteChange: -1.08,
      percentChange: -1.58,
    };
  }

  // 1. Direct match in dummyMarketDepthData
  const directMatch = dummyMarketDepthData.find(
    (d) =>
      d.tradingSymbol.toLowerCase() === decoded ||
      d.tradingSymbol.toLowerCase().replace('-eq', '') === decoded ||
      d.displayName.toLowerCase() === decoded
  );
  if (directMatch) return directMatch;

  // 2. Partial match in dummyMarketDepthData
  const partialMatch = dummyMarketDepthData.find(
    (d) =>
      d.tradingSymbol.toLowerCase().includes(decoded) ||
      decoded.includes(d.tradingSymbol.toLowerCase().replace('-eq', '')) ||
      d.displayName.toLowerCase().includes(decoded) ||
      d.displayName.toLowerCase().replace(/\s+/g, '') === decoded.replace(/\s+/g, '')
  );
  if (partialMatch) return partialMatch;

  // 3. Match in STOCK_DATA
  const stockDataMatch = STOCK_DATA.find(
    (s) =>
      s.symbol.toLowerCase() === decoded ||
      s.tradingSymbol?.toLowerCase() === decoded ||
      s.id.toLowerCase() === decoded ||
      s.name.toLowerCase().includes(decoded)
  );
  if (stockDataMatch) return stockDataMatch;

  // 4. Fallback synthetic record
  const cleanName = raw.replace('-EQ', '').toUpperCase();
  return {
    ...dummyMarketDepthData[0],
    displayName: cleanName,
    tradingSymbol: raw.toUpperCase().endsWith('-EQ') ? raw.toUpperCase() : `${raw.toUpperCase()}-EQ`,
  };
};

export const DashboardLayout = () => {
  const [activeCategory, setActiveCategory] = useState('stocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'watchlist' | 'holdings' | 'positions' | 'orders' | 'stock_detail' ...
  const [selectedStock, setSelectedStock] = useState(null);

  // 4 Core Portfolio & Trading States (Figma 1:1 Match)
  const [holdings, setHoldings] = useState(INITIAL_HOLDINGS);
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [watchlists, setWatchlists] = useState(INITIAL_WATCHLISTS);

  // Synchronize URL Hash navigation
  const syncFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const rawHash = window.location.hash || '';
    // Normalize hash: strip query string attached to hash and trailing slashes
    const hash = rawHash.split('?')[0].replace(/\/+$/, '') || rawHash;

    // Check query param fallback (?stock=SYMBOL)
    const searchParams = new URLSearchParams(window.location.search);
    const queryStock = searchParams.get('stock');

    // 1. Explicit Hash Routes (Takes Top Priority)
    if (hash.startsWith('#/stock/')) {
      const rawSymbol = hash.replace('#/stock/', '');
      const resolved = resolveStockBySymbol(rawSymbol);
      setSelectedStock(resolved);
      setCurrentView('stock_detail');
    } else if (hash === '#/watchlist') {
      setSelectedStock(null);
      setCurrentView('watchlist');
    } else if (hash === '#/holdings') {
      setSelectedStock(null);
      setCurrentView('holdings');
    } else if (hash === '#/positions') {
      setSelectedStock(null);
      setCurrentView('positions');
    } else if (hash === '#/orders') {
      setSelectedStock(null);
      setCurrentView('orders');
    } else if (hash === '#/market-movers') {
      setSelectedStock(null);
      setCurrentView('market_movers_detail');
    } else if (hash === '#/stocks-by-sector') {
      setSelectedStock(null);
      setCurrentView('stocks_by_sector_detail');
    } else if (hash === '#/collections') {
      setSelectedStock(null);
      setCurrentView('collections_detail');
    } else if (hash === '#/business-groups') {
      setSelectedStock(null);
      setCurrentView('business_groups_detail');
    } else if (hash === '#/depth') {
      setSelectedStock(null);
      setCurrentView('dashboard');
      setActiveCategory('depth');
    } else if (hash === '#/fno') {
      setSelectedStock(null);
      setCurrentView('dashboard');
      setActiveCategory('fno');
    } else if (hash === '#/commodity') {
      setSelectedStock(null);
      setCurrentView('dashboard');
      setActiveCategory('commodity');
    } else if (hash === '#/bhavcopy') {
      setSelectedStock(null);
      setCurrentView('dashboard');
      setActiveCategory('bhavcopy');
    } else if (hash === '#/charts') {
      setSelectedStock(null);
      setCurrentView('dashboard');
      setActiveCategory('charts');
    } else if (hash === '#/detail') {
      const defaultStock = resolveStockBySymbol('RPOWER-EQ');
      setSelectedStock(defaultStock);
      setCurrentView('stock_detail');
      window.location.hash = '#/stock/RPOWER-EQ';
    } else if (queryStock && (!hash || hash === '#' || hash === '#/' || hash === '#/stocks')) {
      const resolved = resolveStockBySymbol(queryStock);
      setSelectedStock(resolved);
      setCurrentView('stock_detail');
      window.location.hash = `#/stock/${encodeURIComponent(queryStock)}`;
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.hash);
      } catch (_) {}
    } else {
      setSelectedStock(null);
      setCurrentView('dashboard');
      setActiveCategory('stocks');
    }
  }, []);

  useEffect(() => {
    syncFromUrl();
    window.addEventListener('hashchange', syncFromUrl);
    return () => {
      window.removeEventListener('hashchange', syncFromUrl);
    };
  }, [syncFromUrl]);

  const handleSelectStock = (stock) => {
    if (!stock) return;
    const symbol = stock.tradingSymbol || stock.symbol || stock.name || 'RELIANCE-EQ';
    const cleanSymbol = encodeURIComponent(symbol);
    if (typeof window !== 'undefined') {
      window.location.hash = `#/stock/${cleanSymbol}`;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    setSelectedStock(stock);
    setCurrentView('stock_detail');
  };

  const handleBackToDashboard = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '#/';
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    setSelectedStock(null);
    setCurrentView('dashboard');
    setActiveCategory('stocks');
  };

  // Watchlist Actions: Add and Remove stocks dynamically
  const handleAddStockToWatchlist = (tabName, newStock) => {
    setWatchlists((prev) => {
      const currentList = prev[tabName] || [];
      const exists = currentList.some((s) => s.symbol === newStock.symbol);
      if (exists) return prev;
      return {
        ...prev,
        [tabName]: [newStock, ...currentList],
      };
    });
  };

  const handleRemoveStockFromWatchlist = (tabName, symbol) => {
    setWatchlists((prev) => {
      const currentList = prev[tabName] || [];
      return {
        ...prev,
        [tabName]: currentList.filter((s) => s.symbol !== symbol),
      };
    });
  };

  // Holdings Actions: Add simulated stocks (e.g. from 3-stock profit simulator)
  const handleAddHoldings = (newHoldingsList) => {
    setHoldings((prev) => [...newHoldingsList, ...prev]);

    // Also add to positions to maintain portfolio consistency
    const matchingPositions = newHoldingsList.map((h) => ({
      id: `pos_${h.id}`,
      symbol: h.symbol,
      tradingSymbol: h.tradingSymbol,
      name: h.name,
      exchange: h.exchange,
      productType: 'Delivery',
      qty: h.qty,
      avgPrice: h.avgPrice,
      ltp: h.ltp,
      totalPnl: h.totalPnl,
      totalPnlPercent: h.totalPnlPercent,
      unrealisedPnl: h.totalPnl,
      unrealisedPnlPercent: h.totalPnlPercent,
      realisedPnl: 0.00,
    }));
    setPositions((prev) => [...matchingPositions, ...prev]);
  };

  // Positions Actions: Exit All Positions
  const handleExitAllPositions = () => {
    setPositions((prev) =>
      prev.map((p) => {
        const unrealised = p.unrealisedPnl || 0;
        return {
          ...p,
          qty: 0,
          realisedPnl: (p.realisedPnl || 0) + unrealised,
          unrealisedPnl: 0,
          totalPnl: 0,
        };
      })
    );
  };

  // Positions Actions: Add custom simulated positions
  const handleAddPositions = (newPositionsList) => {
    setPositions((prev) => [...newPositionsList, ...prev]);
  };

  // Orders Actions: Cancel All Open Orders
  const handleCancelAllOrders = () => {
    setOrders((prev) =>
      prev.map((o) =>
        o.status === 'Open' || o.status === 'Partially Executed'
          ? { ...o, status: 'Cancelled' }
          : o
      )
    );
  };

  // Global Order Submit handler (when an order is executed via RightOrderPanel)
  const handleGlobalOrderSubmit = (newOrder) => {
    const formattedOrder = {
      id: newOrder.id || `ord_${Date.now()}`,
      symbol: newOrder.symbol?.replace('-EQ', '') || 'RPOWER',
      tradingSymbol: newOrder.symbol || 'RPOWER-EQ',
      name: newOrder.displayName || 'Reliance Power',
      tag: `${newOrder.exchange || 'NSE'} • ${newOrder.productType || 'Delivery'} • ${newOrder.orderType || 'Limit'}`,
      action: newOrder.action || 'BUY',
      filledQty: newOrder.qty || 1,
      totalQty: newOrder.qty || 1,
      status: 'Executed',
      unitPrice: parseFloat(newOrder.price) || 0,
      orderValue: Number((parseFloat(newOrder.price) * (Number(newOrder.qty) || 1)).toFixed(2)),
      time: newOrder.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setOrders((prev) => [formattedOrder, ...prev]);

    // Update positions and holdings
    const isSell = newOrder.action === 'SELL';
    const orderQty = Number(newOrder.qty) || 0;
    const orderPrice = parseFloat(newOrder.price) || 0;

    // Update Positions
    setPositions((prev) => {
      const existing = prev.find((p) => p.tradingSymbol === newOrder.symbol || p.symbol === formattedOrder.symbol);
      if (existing) {
        const newQty = isSell ? existing.qty - orderQty : existing.qty + orderQty;
        return prev.map((p) =>
          p.id === existing.id ? { ...p, qty: newQty } : p
        );
      }
      return [
        {
          id: `pos_${Date.now()}`,
          symbol: formattedOrder.symbol,
          tradingSymbol: newOrder.symbol,
          name: formattedOrder.name,
          exchange: newOrder.exchange || 'NSE',
          productType: newOrder.productType || 'Intraday',
          qty: isSell ? -orderQty : orderQty,
          avgPrice: orderPrice,
          ltp: orderPrice,
          totalPnl: 0,
          totalPnlPercent: 0,
          unrealisedPnl: 0,
          unrealisedPnlPercent: 0,
          realisedPnl: 0.00,
        },
        ...prev,
      ];
    });

    // Update Holdings for Delivery Buy orders
    if (!isSell && (!newOrder.productType || newOrder.productType.toUpperCase().includes('LONG-TERM') || newOrder.productType.toUpperCase().includes('DELIVERY'))) {
      setHoldings((prev) => {
        const existing = prev.find((h) => h.tradingSymbol === newOrder.symbol || h.symbol === formattedOrder.symbol);
        if (existing) {
          const newQty = existing.qty + orderQty;
          const newInvested = Number((existing.invested + (orderQty * orderPrice)).toFixed(2));
          const newAvg = Number((newInvested / newQty).toFixed(2));
          const newCurrentVal = Number((newQty * (existing.ltp || orderPrice)).toFixed(2));
          return prev.map((h) =>
            h.id === existing.id
              ? {
                  ...h,
                  qty: newQty,
                  invested: newInvested,
                  avgPrice: newAvg,
                  currentValue: newCurrentVal,
                }
              : h
          );
        }
        return [
          {
            id: `h_${Date.now()}`,
            symbol: formattedOrder.symbol,
            tradingSymbol: newOrder.symbol,
            name: formattedOrder.name,
            exchange: newOrder.exchange || 'NSE',
            qty: orderQty,
            pledgedQty: 0,
            avgPrice: orderPrice,
            invested: Number((orderQty * orderPrice).toFixed(2)),
            currentValue: Number((orderQty * orderPrice).toFixed(2)),
            dayPnl: 0,
            dayPnlPercent: 0,
            totalPnl: 0,
            totalPnlPercent: 0,
            ltp: orderPrice,
          },
          ...prev,
        ];
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-app-bg text-text-main">
      {/* 1. Top Ticker Banner (Full Width) */}
      <TickerBar />

      {/* 2. Main Navbar (Full Width with Quick Stock Search & Detail Opener) */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectStock={handleSelectStock}
        onGoHome={handleBackToDashboard}
      />

      {/* 3. Lower Workspace: Extreme Left Sidebar (Below Navbar) + Main Content */}
      <div className="flex-1 flex w-full relative">
        {/* Left Slim Vertical Sidebar positioned at the extreme left, below navbar */}
        <Sidebar
          activeTab={
            currentView === 'stock_detail'
              ? 'explore'
              : currentView === 'dashboard'
              ? (activeCategory === 'stocks' ? 'explore' : activeCategory)
              : currentView
          }
          onTabChange={(tabId) => {
            try {
              if (window.location.search) {
                window.history.replaceState(null, '', window.location.pathname);
              }
            } catch (_) {}

            if (tabId === 'explore') {
              handleBackToDashboard();
            } else if (tabId === 'watchlist') {
              setSelectedStock(null);
              setCurrentView('watchlist');
              if (typeof window !== 'undefined') {
                window.location.hash = '#/watchlist';
                window.scrollTo({ top: 0, behavior: 'instant' });
              }
            } else if (tabId === 'holdings') {
              setSelectedStock(null);
              setCurrentView('holdings');
              if (typeof window !== 'undefined') {
                window.location.hash = '#/holdings';
                window.scrollTo({ top: 0, behavior: 'instant' });
              }
            } else if (tabId === 'positions') {
              setSelectedStock(null);
              setCurrentView('positions');
              if (typeof window !== 'undefined') {
                window.location.hash = '#/positions';
                window.scrollTo({ top: 0, behavior: 'instant' });
              }
            } else if (tabId === 'orders') {
              setSelectedStock(null);
              setCurrentView('orders');
              if (typeof window !== 'undefined') {
                window.location.hash = '#/orders';
                window.scrollTo({ top: 0, behavior: 'instant' });
              }
            }
          }}
        />

        {/* Dashboard Content Container */}
        <main className="flex-1 pt-2 pb-5 sm:pb-6 px-3 sm:px-4 w-full min-w-0">
          {currentView === 'stock_detail' ? (
            /* Figma Turbo Web UI Stock Detail View */
            <ErrorBoundary
              title={`Unable to load detail view for ${selectedStock?.displayName || selectedStock?.name || 'this stock'}`}
              onBack={handleBackToDashboard}
            >
              <StockDetailPage
                stock={selectedStock}
                onBack={handleBackToDashboard}
                onOrderPlaced={handleGlobalOrderSubmit}
              />
            </ErrorBoundary>
          ) : currentView === 'watchlist' ? (
            /* 1. Watchlist Screen (Table View & Pro Chart/Depth Split View) */
            <WatchlistDashboard
              watchlists={watchlists}
              positions={positions}
              holdings={holdings}
              orders={orders}
              onSelectStock={handleSelectStock}
              onAddStockToWatchlist={handleAddStockToWatchlist}
              onRemoveStockFromWatchlist={handleRemoveStockFromWatchlist}
              onUpdateWatchlists={setWatchlists}
              onOrderPlaced={handleGlobalOrderSubmit}
            />
          ) : currentView === 'holdings' ? (
            /* 2. Holdings Screen (media_1793862901368_6115bccc.png) */
            <HoldingsDashboard
              holdings={holdings}
              onSelectStock={handleSelectStock}
              onAddHoldings={handleAddHoldings}
            />
          ) : currentView === 'positions' ? (
            /* 3. Positions Screen (media_1793862901380_93385bcd.png) */
            <PositionsDashboard
              positions={positions}
              onSelectStock={handleSelectStock}
              onExitAllPositions={handleExitAllPositions}
              onAddPositions={handleAddPositions}
            />
          ) : currentView === 'orders' ? (
            /* 4. Orders Screen (media_1793862901439_a86a7d10.jpg) */
            <OrdersDashboard
              orders={orders}
              onSelectStock={handleSelectStock}
              onCancelAllOrders={handleCancelAllOrders}
            />
          ) : currentView === 'market_movers_detail' ? (
            /* View All Detailed Market Movers Table View */
            <MarketMoversDetail
              onBack={() => setCurrentView('dashboard')}
              searchQuery={searchQuery}
              onSelectStock={handleSelectStock}
            />
          ) : currentView === 'stocks_by_sector_detail' ? (
            /* View All Stocks by Sector View */
            <StocksBySectorDetail
              onBack={() => setCurrentView('dashboard')}
              searchQuery={searchQuery}
              onSelectStock={handleSelectStock}
            />
          ) : currentView === 'collections_detail' ? (
            /* View All Collections for You View */
            <CollectionsDetail
              onBack={() => setCurrentView('dashboard')}
              searchQuery={searchQuery}
              onSelectStock={handleSelectStock}
            />
          ) : currentView === 'business_groups_detail' ? (
            /* View All Top Business Groups View */
            <BusinessGroupDetail
              onBack={() => setCurrentView('dashboard')}
              searchQuery={searchQuery}
              onSelectStock={handleSelectStock}
            />
          ) : (
            /* Standard Dashboard View */
            <>
              {/* Header Title: "Market" & Category Tabs */}
              <div className="mb-2.5 bg-card-bg">
                <h1 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight pl-1">
                  Market
                </h1>

                {/* Category Tabs: Stocks | F&O | Commodity */}
                <div className="mt-1.5 flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
                  {MAIN_CATEGORY_TABS.map((tab) => {
                    const isActive = activeCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.location.hash = tab.id === 'stocks' ? '#/' : `#/${tab.id}`;
                          }
                          setCurrentView('dashboard');
                          setActiveCategory(tab.id);
                        }}
                        className={`relative pb-2 px-3 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                          isActive
                            ? 'text-primary font-semibold'
                            : 'text-text-muted hover:text-text-main'
                        }`}
                      >
                        {tab.label}
                        {isActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional rendering for tabs */}
              {activeCategory === 'stocks' && (
                <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-3 items-start">
                  {/* Left Column: Market Movers (55% Width) */}
                  <section className="space-y-3 min-w-0">
                    <MarketMovers
                      searchQuery={searchQuery}
                      onViewAll={() => setCurrentView('market_movers_detail')}
                      onSelectStock={handleSelectStock}
                    />
                  </section>

                  {/* Right Column: Expanded Sections (45% Width) */}
                  <section className="space-y-3 min-w-0">
                    {/* 1. Top Business Groups */}
                    <BusinessGroups
                      onSelectGroup={(group) => {
                        setSearchQuery(group.name);
                      }}
                      onViewAll={() => setCurrentView('business_groups_detail')}
                    />

                    {/* 2. Collections for You */}
                    <Collections
                      onSelectCollection={(col) => {
                        console.log('Selected collection:', col.title);
                      }}
                      onViewAll={() => setCurrentView('collections_detail')}
                    />

                    {/* 3. Institutional Net Flow */}
                    <NetFlowCard />

                    {/* 4. Expert's Pick with Buy Call & Target Prices */}
                    <ExpertsPick onSelectStock={handleSelectStock} />

                    {/* 5. Promotional Banners (5x Margin MTF & Refer/Earn) */}
                    <PromoBanners />

                    {/* 6. Sector Heatmap with Visual Grid & Legend */}
                    <SectorHeatmap />

                    {/* 7. Stocks by Sectors Pill Chips */}
                    <StocksBySectors
                      onSelectSector={(sector) => {
                        setSearchQuery(sector);
                      }}
                      onViewAll={() => setCurrentView('stocks_by_sector_detail')}
                    />

                    {/* 8. News & Updates with Category Filter */}
                    <NewsUpdates />

                    {/* 9. Knowledge Centre Educational Cards */}
                    <KnowledgeCentre />
                  </section>
                </div>
              )}

              {activeCategory === 'depth' && (
                <MarketDepthViewer
                  searchQuery={searchQuery}
                  onSelectStock={handleSelectStock}
                />
              )}

              {activeCategory === 'fno' && <FnoLandingPage />}

              {activeCategory === 'commodity' && <CommodityLandingPage />}

              {activeCategory === 'bhavcopy' && (
                <BhavcopyDashboard
                  searchQuery={searchQuery}
                  onSelectStock={handleSelectStock}
                />
              )}

              {activeCategory === 'charts' && (
                <div className="space-y-3">
                  <TradingChart
                    instrumentKey="NSE_INDEX|Nifty 50"
                    interval="day"
                    height={460}
                  />
                  <OptionsDataViewer defaultInstrument="NSE_INDEX|Nifty 50" />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
