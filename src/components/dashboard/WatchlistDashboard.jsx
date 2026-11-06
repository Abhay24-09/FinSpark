import { useState, useMemo, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  ExternalLink,
  ShoppingBag,
  Search,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Edit2,
  Clock,
  BarChart2,
  MoreVertical,
  Bookmark,
  Menu,
  CandlestickChart,
  LayoutGrid,
  Share2,
  Calendar,
  Pin,
  Link,
  Gift,
} from 'lucide-react';
import CompanyLogo from '../common/CompanyLogo';
import { STOCK_DATA } from '../../data/marketData';
import TradingChart from '../TradingChart';
import mascotImage from '../../assets/no-positions-mascot.png';
import RightOrderPanel from '../stock-detail/RightOrderPanel';
import FilterSidebar from '../common/FilterSidebar';
import ManageWatchlistModal from './ManageWatchlistModal';

const WATCHLIST_DEPTH_BIDS = [
  { price: 159.61, orders: 12, quantity: 2250268 },
  { price: 159.30, orders: 12, quantity: 4858988 },
  { price: 159.12, orders: 12, quantity: 2050348 },
  { price: 158.60, orders: 12, quantity: 1528447 },
  { price: 158.55, orders: 12, quantity: 4838813 },
];

const WATCHLIST_DEPTH_ASKS = [
  { price: 159.67, orders: 123, quantity: 2250268 },
  { price: 159.46, orders: 123, quantity: 4858988 },
  { price: 159.27, orders: 123, quantity: 2050348 },
  { price: 158.65, orders: 123, quantity: 1528447 },
  { price: 158.59, orders: 123, quantity: 4838813 },
];

export const WatchlistDashboard = ({
  watchlists = {},
  positions = [],
  holdings = [],
  orders = [],
  onSelectStock,
  onAddStockToWatchlist,
  onRemoveStockFromWatchlist,
  onOrderPlaced,
  onUpdateWatchlists,
}) => {
  const [internalWatchlists, setInternalWatchlists] = useState(watchlists);

  // Sync internal state when external prop changes
  useMemo(() => {
    if (watchlists && Object.keys(watchlists).length > 0) {
      setInternalWatchlists(watchlists);
    }
  }, [watchlists]);

  const currentWatchlists = internalWatchlists;
  const watchlistNames = Object.keys(currentWatchlists);
  const [activeTab, setActiveTab] = useState(watchlistNames[0] || 'My First List');
  const [viewMode, setViewMode] = useState('chart'); // 'chart' (Pro Split View) | 'table' (Full Table View)
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageWatchlistOpen, setIsManageWatchlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [basketToast, setBasketToast] = useState(false);

  // Watchlist Management Handlers
  const handleCreateWatchlist = (name) => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    if (currentWatchlists[trimmed]) return;
    const updated = {
      ...currentWatchlists,
      [trimmed]: [],
    };
    setInternalWatchlists(updated);
    setActiveTab(trimmed);
    if (onUpdateWatchlists) onUpdateWatchlists(updated);
  };

  const handleRenameWatchlist = (oldName, newName) => {
    if (!newName.trim() || oldName === newName.trim()) return;
    const trimmed = newName.trim();
    const updated = {};
    Object.keys(currentWatchlists).forEach((key) => {
      if (key === oldName) {
        updated[trimmed] = currentWatchlists[oldName];
      } else {
        updated[key] = currentWatchlists[key];
      }
    });
    setInternalWatchlists(updated);
    if (activeTab === oldName) {
      setActiveTab(trimmed);
    }
    if (onUpdateWatchlists) onUpdateWatchlists(updated);
  };

  const handleDeleteWatchlist = (name) => {
    const keys = Object.keys(currentWatchlists);
    if (keys.length <= 1) return;
    const updated = { ...currentWatchlists };
    delete updated[name];
    setInternalWatchlists(updated);
    if (activeTab === name) {
      const remainingKeys = Object.keys(updated);
      setActiveTab(remainingKeys[0]);
    }
    if (onUpdateWatchlists) onUpdateWatchlists(updated);
  };

  const currentStocks = currentWatchlists[activeTab] || [];

  // Figma 1:1 Filter & Sort state (Node ID: 7737:52410)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [activeSort, setActiveSort] = useState({ field: null, order: 'desc' });
  const [activeFilters, setActiveFilters] = useState({});

  const displayStocks = useMemo(() => {
    let result = [...currentStocks];

    if (activeFilters.exchange?.length) {
      result = result.filter((s) => activeFilters.exchange.includes(s.exchange || 'NSE'));
    }

    if (activeFilters.segment?.length) {
      result = result.filter((s) => {
        const seg = s.segment || (s.symbol?.includes('FUT') ? 'F&O' : 'Equity');
        return activeFilters.segment.includes(seg);
      });
    }

    if (activeFilters.status?.length) {
      result = result.filter((s) => {
        const chg = s.change ?? s.percentChange ?? 0;
        if (activeFilters.status.includes('Profit') && chg >= 0) return true;
        if (activeFilters.status.includes('Loss') && chg < 0) return true;
        return false;
      });
    }

    if (activeSort.field) {
      result.sort((a, b) => {
        if (activeSort.field === 'alphabetical') {
          const nameA = a.name || a.displayName || a.symbol || '';
          const nameB = b.name || b.displayName || b.symbol || '';
          return activeSort.order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        if (activeSort.field === 'ltp') {
          const ltpA = a.ltp ?? a.lastTradedPrice ?? 0;
          const ltpB = b.ltp ?? b.lastTradedPrice ?? 0;
          return activeSort.order === 'asc' ? ltpA - ltpB : ltpB - ltpA;
        }
        if (activeSort.field === 'change') {
          const chgA = a.percentChange ?? a.change ?? 0;
          const chgB = b.percentChange ?? b.change ?? 0;
          return activeSort.order === 'asc' ? chgA - chgB : chgB - chgA;
        }
        return 0;
      });
    }

    return result;
  }, [currentStocks, activeSort, activeFilters]);

  // Active stock selected for Chart and Market Depth views
  const [selectedScrip, setSelectedScrip] = useState(null);
  const activeStock = selectedScrip || displayStocks[0] || {
    symbol: 'RPOWER',
    tradingSymbol: 'RPOWER-EQ',
    name: 'Reliance Power',
    exchange: 'NSE',
    ltp: 67.54,
    change: -1.08,
    percentChange: -1.58,
  };

  // Dynamically resolve full mock data (including depth, bids, asks, totals)
  const matchedStockData = useMemo(() => {
    return STOCK_DATA.find(
      (s) =>
        s.symbol === activeStock?.symbol ||
        s.tradingSymbol === activeStock?.tradingSymbol ||
        s.name === activeStock?.name
    ) || activeStock;
  }, [activeStock]);

  const bids = (matchedStockData?.bids && matchedStockData.bids.length > 0)
    ? matchedStockData.bids
    : WATCHLIST_DEPTH_BIDS;

  const asks = (matchedStockData?.asks && matchedStockData.asks.length > 0)
    ? matchedStockData.asks
    : WATCHLIST_DEPTH_ASKS;

  const totalBuyQty = matchedStockData?.totalBuyQuantity || 33275045;
  const totalSellQty = matchedStockData?.totalSellQuantity || 57875307;
  const totalBoth = totalBuyQty + totalSellQty;
  const buyRatioPct = totalBoth > 0 ? ((totalBuyQty / totalBoth) * 100).toFixed(2) : '40.93';
  const sellRatioPct = totalBoth > 0 ? (100 - parseFloat(buyRatioPct)).toFixed(2) : '59.07';

  const [activeExchange, setActiveExchange] = useState(activeStock.exchange || 'NSE');
  const [hoveredSymbol, setHoveredSymbol] = useState(null);
  const [isDepthOpen, setIsDepthOpen] = useState(true);
  const [rightPanelSubTab, setRightPanelSubTab] = useState('positions'); // 'positions' | 'holdings' | 'orders'

  // Order Panel Drawer State (for Buy/Sell modal from this screen)
  const [orderDrawer, setOrderDrawer] = useState({
    isOpen: false,
    stock: null,
    action: 'BUY',
  });

  // Filter stocks available to add (ONLY from our project's authentic STOCK_DATA mock data)
  const availableToAdd = useMemo(() => {
    const existingSymbols = new Set(currentStocks.map((s) => s.symbol));
    const query = searchQuery.trim().toLowerCase();

    return STOCK_DATA.filter((s) => {
      const matchSearch =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.symbol.toLowerCase().includes(query) ||
        (s.tradingSymbol && s.tradingSymbol.toLowerCase().includes(query));
      return matchSearch;
    }).map((s) => ({
      ...s,
      isAlreadyAdded: existingSymbols.has(s.symbol) || existingSymbols.has(s.tradingSymbol?.replace('-EQ', '')),
    }));
  }, [currentStocks, searchQuery]);

  const handleAddStock = (stock) => {
    if (onAddStockToWatchlist) {
      const cleanSymbol = stock.symbol || stock.tradingSymbol?.replace('-EQ', '');
      const newStockRecord = {
        symbol: cleanSymbol,
        tradingSymbol: stock.tradingSymbol || `${cleanSymbol}-EQ`,
        name: stock.name || stock.displayName,
        exchange: stock.exchange || 'NSE',
        volume: Number((stock.volumeTradedToday || 15000000)).toLocaleString('en-IN'),
        ltp: Number(stock.lastTradedPrice || stock.ltp || 100),
        change: Number(stock.absoluteChange ?? (stock.change ? parseFloat(stock.change) : -1.08)),
        percentChange: Number(stock.percentChange ? parseFloat(stock.percentChange) : -1.58),
        open: Number(stock.open || (stock.lastTradedPrice * 0.99).toFixed(2)),
        prevClose: Number(stock.close || stock.prevClose || (stock.lastTradedPrice * 0.995).toFixed(2)),
      };
      onAddStockToWatchlist(activeTab, newStockRecord);
    }
  };

  const handleRemoveStock = (symbol, e) => {
    e?.stopPropagation();
    if (activeStock?.symbol === symbol) {
      const remaining = currentStocks.filter((s) => s.symbol !== symbol);
      setSelectedScrip(remaining[0] || null);
    }
    if (onRemoveStockFromWatchlist) {
      onRemoveStockFromWatchlist(activeTab, symbol);
    }
  };

  const handleAddToBasket = () => {
    setBasketToast(true);
    setTimeout(() => {
      setBasketToast(false);
    }, 2000);
  };

  const [hoveredTableSymbol, setHoveredTableSymbol] = useState(null);
  const [openDropdownSymbol, setOpenDropdownSymbol] = useState(null);
  const [quickToast, setQuickToast] = useState(null);
  const dropdownRef = useRef(null);

  const showQuickToast = (message) => {
    setQuickToast(message);
    setTimeout(() => {
      setQuickToast(null);
    }, 2400);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownSymbol(null);
      }
    };
    if (openDropdownSymbol) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [openDropdownSymbol]);

  const openOrderPanel = (stock, action) => {
    setOrderDrawer({
      isOpen: true,
      stock: stock || activeStock,
      action: action || 'BUY',
    });
  };

  const handleOrderSubmitted = (order) => {
    if (onOrderPlaced) {
      onOrderPlaced(order);
    }
    setOrderDrawer((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="w-full select-none font-['Poppins',sans-serif] space-y-3">
      {/* 1. White Background Container for Watchlist Headings & Sub-tabs (Figma 1:1 Match) */}
      <div className="bg-white border border-gray-100/90 shadow-2xs px-4 pt-3.5 pb-0">
        {/* Row 1: Header Title & Top View Toggle Buttons */}
        <div className="flex items-center justify-between gap-3 pb-2">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Watchlist
          </h1>

          {/* View Toggle Buttons in Heading Div (Graph / Split Candlestick vs Full Table) */}
          <div className="flex items-center gap-1.5">
            {/* Graph / Candlestick Toggle Button (Opens Pro Trading Chart & Depth Split View) */}
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'chart'
                  ? 'bg-[#FFEAD5]/80 text-[#FF7A00]'
                  : 'text-[#FF7A00]/70 hover:text-[#FF7A00] hover:bg-[#FFEAD5]/40'
              }`}
              title="Pro Trading Chart & Depth View"
              aria-label="Switch to Graph View"
            >
              <svg
                className="w-4.5 h-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="3" x2="8" y2="21" />
                <rect
                  x="5.5"
                  y="6"
                  width="5"
                  height="7"
                  rx="2"
                  fill={viewMode === 'chart' ? '#FF7A00' : 'currentColor'}
                />
                <line x1="16" y1="3" x2="16" y2="21" />
                <rect
                  x="13.5"
                  y="11"
                  width="5"
                  height="7"
                  rx="2"
                  fill={viewMode === 'chart' ? '#FF7A00' : 'currentColor'}
                />
              </svg>
            </button>

            {/* Table Toggle Button (Opens Full Watchlist Table View) */}
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#FFEAD5]/80 text-[#FF7A00]'
                  : 'text-[#FF7A00]/70 hover:text-[#FF7A00] hover:bg-[#FFEAD5]/40'
              }`}
              title="Full Table View"
              aria-label="Switch to Table View"
            >
              <svg
                className="w-4.5 h-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="4" x2="9" y2="20" />
                <line x1="15" y1="4" x2="15" y2="20" />
              </svg>
            </button>
          </div>
        </div>

        {/* Row 2: Sub-Tabs Bar (My First List | Energy Tycoon | FAANG | Renewables | NIFTY Beaters) */}
        <div className="border-b border-gray-100 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            {watchlistNames.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative py-2.5 cursor-pointer transition-colors whitespace-nowrap ${
                    isActive ? 'text-[#603DC8] font-semibold' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#603DC8] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Horizontal 3 Bar Line Icon Button (Manage Watchlist) matching Figma Image 1 */}
          <button
            type="button"
            id="btn-manage-watchlist"
            onClick={() => setIsManageWatchlistOpen(true)}
            className="w-8 h-8 rounded-xl border border-gray-900 bg-white hover:bg-gray-50 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
            title="Manage Watchlist"
            aria-label="Manage Watchlist"
          >
            <div className="flex flex-col items-center justify-center gap-[3px] select-none">
              <span className="w-4 h-[2px] bg-[#FF7A00] rounded-full" />
              <span className="w-4 h-[2px] bg-[#FF7A00] rounded-full" />
              <span className="w-4 h-[2px] bg-[#FF7A00] rounded-full" />
            </div>
          </button>
        </div>
      </div>

      {basketToast && (
        <div className="bg-[#D2F9E5] text-[#00BE5C] px-4 py-2.5 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4" />
          <span>All stocks from "{activeTab}" successfully added to your order basket!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: PRO TRADING SPLIT VIEW (media_1793870854761_167803a3.jpg)       */}
      {/* ========================================================================= */}
      {viewMode === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-[24fr_49fr_27fr] gap-3 items-start animate-in fade-in duration-150">
          {/* ===================================================================== */}
          {/* COLUMN 1: LEFT STOCK LIST (~24% Width)                                */}
          {/* ===================================================================== */}
          <div className="bg-white border border-gray-200/80 shadow-2xs p-3 space-y-2.5">
            {/* Top Action Pills: Filter, Add Stock (+), Edit (Pencil), Basket */}
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setIsFilterSidebarOpen(true)}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  activeSort.field || Object.values(activeFilters).flat().length > 0
                    ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'
                }`}
                title="Filter & Sort Scrips"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="w-8 h-8 rounded-full border border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00]/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Add Stock to Watchlist"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsEditMode((prev) => !prev)}
                className={`w-8 h-8 rounded-full border transition-colors flex items-center justify-center cursor-pointer ${
                  isEditMode
                    ? 'bg-[#FF7A00] text-white border-[#FF7A00]'
                    : 'border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00]/10'
                }`}
                title={isEditMode ? 'Done Editing' : 'Edit Watchlist'}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleAddToBasket}
                className="w-8 h-8 rounded-full border border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00]/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Add All to Basket"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Edit Mode Instruction Banner */}
            {isEditMode && (
              <div className="p-2 bg-amber-50 border border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800 animate-in fade-in duration-150">
                <span>Click <strong>🗑</strong> to remove scrip</span>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="text-xs font-bold text-[#FF7A00] hover:underline cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {/* Scrollable Scrip List matching screenshot 1:1 */}
            <div className="space-y-1 max-h-[640px] overflow-y-auto no-scrollbar divide-y divide-gray-50">
              {displayStocks.map((stock) => {
                const isSelected = (activeStock?.symbol === stock.symbol) || (activeStock?.name === stock.name);
                const isHovered = hoveredSymbol === stock.symbol;
                const isPositive = (stock.change ?? 0) >= 0;

                return (
                  <div
                    key={stock.symbol}
                    onMouseEnter={() => setHoveredSymbol(stock.symbol)}
                    onMouseLeave={() => setHoveredSymbol(null)}
                    onClick={() => {
                      if (!isEditMode) {
                        setSelectedScrip(stock);
                        setActiveExchange(stock.exchange || 'NSE');
                      }
                    }}
                    className={`p-2.5 transition-all cursor-pointer relative group flex items-center justify-between ${
                      isSelected && !isEditMode
                        ? 'bg-[#F2FAF5] border border-[#CDEED9]'
                        : 'hover:bg-gray-50/80 border border-transparent'
                    }`}
                  >
                    {/* Left: Logo & Company Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CompanyLogo name={stock.name} size={28} />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs text-gray-900 truncate">
                          {stock.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-medium uppercase">
                            {stock.exchange || 'NSE'}
                          </span>
                          {stock.tag && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-[#EEEFFF] text-[#603DC8] font-bold rounded-md uppercase">
                              {stock.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Remove button if in Edit Mode, otherwise Price & Change / Hover Actions */}
                    {isEditMode ? (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveStock(stock.symbol, e)}
                        className="p-1.5 rounded-lg bg-red-50 text-[#F72F53] hover:bg-red-100 hover:scale-105 transition-all cursor-pointer shrink-0"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : isHovered || isSelected ? (
                      <div className="flex items-center gap-1 shrink-0 animate-in fade-in duration-100">
                        {/* Buy Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openOrderPanel(stock, 'BUY');
                          }}
                          className="w-6 h-6 rounded-md bg-[#00BE5C] hover:bg-[#00A852] text-white font-bold text-[11px] flex items-center justify-center shadow-2xs transition-all cursor-pointer"
                          title="Buy Stock"
                        >
                          B
                        </button>

                        {/* Sell Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openOrderPanel(stock, 'SELL');
                          }}
                          className="w-6 h-6 rounded-md bg-[#F72F53] hover:bg-[#E02647] text-white font-bold text-[11px] flex items-center justify-center shadow-2xs transition-all cursor-pointer"
                          title="Sell Stock"
                        >
                          S
                        </button>

                        {/* Alert / Watch Button */}
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
                          title="Set Price Alert"
                        >
                          <Clock className="w-3 h-3" />
                        </button>

                        {/* Chart Icon Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScrip(stock);
                          }}
                          className="w-6 h-6 rounded-md bg-[#603DC8]/10 text-[#603DC8] hover:bg-[#603DC8]/20 flex items-center justify-center transition-colors cursor-pointer"
                          title="Open Chart"
                        >
                          <BarChart2 className="w-3 h-3" />
                        </button>

                        {/* More Options Button with 8-Item Menu */}
                        <div className="relative" ref={openDropdownSymbol === stock.symbol ? dropdownRef : null}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownSymbol((prev) => (prev === stock.symbol ? null : stock.symbol));
                            }}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                              openDropdownSymbol === stock.symbol
                                ? 'bg-[#603DC8] text-white shadow-xs'
                                : 'text-gray-400 hover:text-gray-800'
                            }`}
                            title="More Actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* 8-Item Dropdown Menu */}
                          {openDropdownSymbol === stock.symbol && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-50"
                            >
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    showQuickToast(`🔔 Price alert (02) active for ${stock.name}`);
                                    setOpenDropdownSymbol(null);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                >
                                  <Clock className="w-4 h-4 text-[#603DC8] shrink-0" />
                                  <span>Price Alert (02)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (typeof window !== 'undefined' && navigator.clipboard) {
                                      navigator.clipboard.writeText(`${window.location.origin}/#/stock/${stock.symbol}`);
                                    }
                                    showQuickToast(`🔗 Link to ${stock.name} copied to clipboard!`);
                                    setOpenDropdownSymbol(null);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                >
                                  <Share2 className="w-4 h-4 text-[#603DC8] shrink-0" />
                                  <span>Share Scrip</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    showQuickToast(`📅 Stock SIP scheduled for ${stock.name}`);
                                    setOpenDropdownSymbol(null);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                >
                                  <Calendar className="w-4 h-4 text-[#603DC8] shrink-0" />
                                  <span>SIP Order</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    showQuickToast(`🛍️ ${stock.name} added to your basket!`);
                                    setOpenDropdownSymbol(null);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                >
                                  <ShoppingBag className="w-4 h-4 text-[#603DC8] shrink-0" />
                                  <span>Add to Basket</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    showQuickToast(`📌 ${stock.name} pinned to header ticker!`);
                                    setOpenDropdownSymbol(null);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                >
                                  <Pin className="w-4 h-4 text-[#603DC8] shrink-0" />
                                  <span>PIN to Header</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSelectStock) {
                                      onSelectStock({ ...stock, defaultTab: 'option_chain' });
                                    } else if (typeof window !== 'undefined') {
                                      window.location.hash = `#/stock/${stock.symbol}?tab=option_chain`;
                                    }
                                    setOpenDropdownSymbol(null);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                >
                                  <Link className="w-4 h-4 text-[#603DC8] shrink-0" />
                                  <span>Show Option Chain</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    showQuickToast(`🎁 Gift Shares transfer flow opened for ${stock.name}`);
                                    setOpenDropdownSymbol(null);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                >
                                  <Gift className="w-4 h-4 text-[#603DC8] shrink-0" />
                                  <span>Gift Shares</span>
                                </button>
                              </div>
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    handleRemoveStock(stock.symbol, e);
                                    showQuickToast(`🗑️ ${stock.name} removed from watchlist`);
                                    setOpenDropdownSymbol(null);
                                  }}
                                  className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-[#F72F53] hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer text-left"
                                >
                                  <Trash2 className="w-4 h-4 text-[#F72F53] shrink-0" />
                                  <span>Remove from Watchlist</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-xs text-gray-900">
                          ₹{Number(stock.ltp).toFixed(2)}
                        </div>
                        <div
                          className={`text-[10px] font-medium ${
                            isPositive ? 'text-[#00BE5C]' : 'text-[#F72F53]'
                          }`}
                        >
                          {isPositive ? '+' : ''}{Number(stock.change).toFixed(2)} ({isPositive ? '+' : ''}{Number(stock.percentChange).toFixed(2)}%)
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* COLUMN 2: CENTER SCRIP HEADER & CANDLESTICK CHART (~49% Width)       */}
          {/* ===================================================================== */}
          <div className="bg-white border border-gray-200/80 shadow-2xs overflow-hidden flex flex-col">
            {/* Scrip Header Bar matching Figma screenshot 1:1 */}
            <div className="p-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              {/* Left: Scrip Name, Exchange Pills & Live Price */}
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-gray-900 text-sm sm:text-base tracking-tight">
                  {activeStock.name || activeStock.displayName || 'Reliance Power'}
                </h2>

                {/* Exchange Radio Buttons */}
                <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveExchange('NSE')}
                    className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                      activeExchange === 'NSE'
                        ? 'bg-[#FFEAD5] text-[#FF7A00] border border-[#FF7A00]'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    NSE
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveExchange('BSE')}
                    className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                      activeExchange === 'BSE'
                        ? 'bg-[#FFEAD5] text-[#FF7A00] border border-[#FF7A00]'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    BSE
                  </button>
                </div>

                {/* Live Price & Change */}
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="text-gray-900">
                    ₹{Number(activeStock.ltp || 67.54).toFixed(2)}
                  </span>
                  <span
                    className={`text-[11px] font-medium ${
                      (activeStock.change ?? -1.08) >= 0 ? 'text-[#00BE5C]' : 'text-[#F72F53]'
                    }`}
                  >
                    {(activeStock.change ?? -1.08) >= 0 ? '+' : ''}
                    {Number(activeStock.change ?? -1.08).toFixed(2)} (
                    {Number(activeStock.percentChange ?? -0.68).toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Right: Sell Button, Buy Button, Bookmark, More */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openOrderPanel(activeStock, 'SELL')}
                  className="px-5 py-2 rounded-lg bg-[#F72F53] hover:bg-[#E02647] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-98"
                >
                  Sell
                </button>

                <button
                  type="button"
                  onClick={() => openOrderPanel(activeStock, 'BUY')}
                  className="px-5 py-2 rounded-lg bg-[#00BE5C] hover:bg-[#00A852] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-98"
                >
                  Buy
                </button>

                <button
                  type="button"
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Bookmark Scrip"
                >
                  <Bookmark className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Candlestick Interactive Chart Area */}
            <div className="w-full h-[540px] bg-white">
              <TradingChart
                stock={activeStock}
                instrumentKey={`NSE_EQ|${activeStock.symbol || 'RPOWER'}`}
                height={540}
                showToolbar={true}
                exchange={activeExchange}
                basePrice={Number(activeStock.ltp || 67.54)}
              />
            </div>
          </div>

          {/* ===================================================================== */}
          {/* COLUMN 3: RIGHT PANEL (MARKET DEPTH & POSITIONS CARD) (~27% Width)    */}
          {/* ===================================================================== */}
          <div className="space-y-3">
            {/* 1. Market Depth Card (Figma 1:1 Match) */}
            <div className="bg-white border border-gray-200/80 shadow-2xs p-3.5 space-y-2.5 select-none">
              {/* Header: Title + Toggle Switch */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm">
                  Market Depth
                </h3>

                {/* Sliding Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setIsDepthOpen((prev) => !prev)}
                  className={`w-[48px] h-[26px] p-[2px] rounded-full transition-all duration-200 ease-in-out cursor-pointer flex items-center shadow-2xs bg-white border ${
                    isDepthOpen ? 'border-gray-300' : 'border-gray-200'
                  }`}
                  title={isDepthOpen ? 'Collapse Depth' : 'Expand Depth'}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out ${
                      isDepthOpen
                        ? 'translate-x-[22px] bg-[#FF7A00] text-white shadow-xs'
                        : 'translate-x-0 bg-gray-200 text-gray-600'
                    }`}
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      className="w-3 h-3"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="3.5" y1="6" x2="10" y2="6" />
                      <line x1="3.5" y1="10" x2="10" y2="10" />
                      <line x1="3.5" y1="14" x2="10" y2="14" />
                      <line x1="15" y1="4.5" x2="15" y2="15.5" />
                      <polyline points="12.5 7 15 4.5 17.5 7" />
                      <polyline points="12.5 13 15 15.5 17.5 13" />
                    </svg>
                  </span>
                </button>
              </div>

              {isDepthOpen && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                  {/* Buy Orders % vs Sell Orders % Metrics */}
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-[#00BE5C]">Buy Orders {buyRatioPct}%</span>
                    <span className="text-[#F72F53]">Sell Orders {sellRatioPct}%</span>
                  </div>

                  {/* Dual Color Progress Bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="bg-[#00BE5C] h-full transition-all duration-300" style={{ width: `${buyRatioPct}%` }} />
                    <div className="bg-[#F72F53] h-full transition-all duration-300" style={{ width: `${sellRatioPct}%` }} />
                  </div>

                  {/* 5-Level Bid/Ask Table Headers */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-medium text-gray-500 pt-1">
                    <div className="flex items-center justify-between px-1">
                      <span>Bid Price</span>
                      <span>Qty</span>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span>Ask Price</span>
                      <span>Qty</span>
                    </div>
                  </div>

                  {/* 5 Rows */}
                  <div className="space-y-1">
                    {bids.slice(0, 5).map((bid, i) => {
                      const ask = asks[i] || { price: 0, orders: 0, quantity: 0 };
                      return (
                        <div key={`depth-row-${i}`} className="grid grid-cols-2 gap-3 text-[11px] px-1 py-0.5 items-center">
                          {/* Bid */}
                          <div
                            onClick={() => openOrderPanel(activeStock, 'BUY')}
                            className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                            title={`Click to Buy at ₹${Number(bid.price).toFixed(2)}`}
                          >
                            <span className="text-[#00BE5C] font-semibold">{Number(bid.price).toFixed(2)}</span>
                            <span className="bg-[#D2F9E5] text-[#00BE5C] font-medium text-[10px] px-2 py-0.5 rounded-full">
                              {Number(bid.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Ask */}
                          <div
                            onClick={() => openOrderPanel(activeStock, 'SELL')}
                            className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                            title={`Click to Sell at ₹${Number(ask.price).toFixed(2)}`}
                          >
                            <span className="text-[#F72F53] font-semibold">{Number(ask.price).toFixed(2)}</span>
                            <span className="bg-[#FEE2E2] text-[#F72F53] font-medium text-[10px] px-2 py-0.5 rounded-full">
                              {Number(ask.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer: Bid Total | Ask Total */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold px-1 pt-1.5 border-t border-gray-100 text-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-normal">Bid Total</span>
                      <span>{Number(totalBuyQty).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-normal">Ask Total</span>
                      <span>{Number(totalSellQty).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Positions, Holdings & Orders Card (Figma 1:1 Match) */}
            <div className="bg-white border border-gray-200/80 shadow-2xs p-3.5 space-y-3">
              {/* Subtab Navigation */}
              <div className="flex items-center gap-6 border-b border-gray-100 pb-2 text-xs font-semibold">
                {[
                  { id: 'positions', label: 'Positions' },
                  { id: 'holdings', label: 'Holdings' },
                  { id: 'orders', label: 'Orders' },
                ].map((tab) => {
                  const isActive = rightPanelSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRightPanelSubTab(tab.id)}
                      className={`relative pb-1 cursor-pointer transition-colors ${
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

              {/* Tab Content */}
              <div className="min-h-[170px] flex flex-col justify-center items-center py-2 px-1">
                {rightPanelSubTab === 'positions' && (
                  positions.length === 0 ? (
                    <div className="text-center space-y-1.5 max-w-[240px]">
                      {/* Whimsical Mascot Illustration (from Figma screenshot) */}
                      <div className="mx-auto w-20 h-20 flex items-center justify-center">
                        <img
                          src={mascotImage}
                          alt="No Active Positions"
                          className="w-20 h-20 object-contain select-none pointer-events-none"
                          loading="lazy"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-gray-900">
                        You have No Active Positions!
                      </h4>
                    </div>
                  ) : (
                    <div className="w-full divide-y divide-gray-100 text-xs">
                      {positions.slice(0, 3).map((pos, i) => (
                        <div key={i} className="py-1.5 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{pos.name || pos.symbol}</div>
                            <div className="text-[10px] text-gray-400">Qty: {pos.qty}</div>
                          </div>
                          <div className={`font-semibold ${pos.totalPnl >= 0 ? 'text-[#00BE5C]' : 'text-[#F72F53]'}`}>
                            {pos.totalPnl >= 0 ? '+' : ''}₹{pos.totalPnl.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {rightPanelSubTab === 'holdings' && (
                  holdings.length === 0 ? (
                    <div className="text-center text-xs text-gray-500 py-6">
                      No holdings available yet.
                    </div>
                  ) : (
                    <div className="w-full divide-y divide-gray-100 text-xs">
                      {holdings.slice(0, 3).map((h, i) => (
                        <div key={i} className="py-1.5 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{h.name || h.symbol}</div>
                            <div className="text-[10px] text-gray-400">Qty: {h.qty}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">₹{h.currentValue?.toFixed(2)}</div>
                            <div className={`text-[10px] ${h.totalPnl >= 0 ? 'text-[#00BE5C]' : 'text-[#F72F53]'}`}>
                              {h.totalPnl >= 0 ? '+' : ''}₹{h.totalPnl?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {rightPanelSubTab === 'orders' && (
                  orders.length === 0 ? (
                    <div className="text-center text-xs text-gray-500 py-6">
                      No orders placed today.
                    </div>
                  ) : (
                    <div className="w-full divide-y divide-gray-100 text-xs">
                      {orders.slice(0, 3).map((ord, i) => (
                        <div key={i} className="py-1.5 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{ord.name || ord.symbol}</div>
                            <div className="text-[10px] text-gray-400">{ord.type} • {ord.status}</div>
                          </div>
                          <div className="font-semibold text-gray-900">
                            {ord.qty} @ ₹{ord.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: FULL WATCHLIST TABLE VIEW (media_1793862901428_8f4d245d.jpg)     */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Table Controls Row: Filter Button on Left, Action Buttons on Right */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Filter Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterSidebarOpen(true)}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shadow-2xs ${
                  activeSort.field || Object.values(activeFilters).flat().length > 0
                    ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold'
                    : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900'
                }`}
                title="Filter & Sort Scrips"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Top 3 Action Buttons: Add Stocks +, Edit Watchlist, Add to Basket */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00]/10 transition-colors cursor-pointer"
              >
                <span>Add Stocks</span>
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsEditMode((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  isEditMode
                    ? 'bg-[#FF7A00] text-white border-[#FF7A00]'
                    : 'border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00]/10'
                }`}
              >
                <span>{isEditMode ? 'Done Editing' : 'Edit Watchlist'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleAddToBasket}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00]/10 transition-colors cursor-pointer"
              >
                <span>Add to Basket</span>
                <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Watchlist Table */}
          <div className="bg-white border border-gray-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-[11px] font-medium bg-gray-50/50">
                    <th className="py-3.5 px-4 font-medium">Name</th>
                    <th className="py-3.5 px-4 font-medium">Symbol</th>
                    <th className="py-3.5 px-4 font-medium">Volume</th>
                    <th className="py-3.5 px-4 font-medium">LTP</th>
                    <th className="py-3.5 px-4 font-medium">Change</th>
                    <th className="py-3.5 px-4 font-medium">% Change</th>
                    <th className="py-3.5 px-4 font-medium">Open</th>
                    <th className="py-3.5 px-4 font-medium">Prev-Close</th>
                    {isEditMode && <th className="py-3.5 px-4 font-medium text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-800">
                  {displayStocks.map((s) => {
                    const isPositive = (s.change ?? 0) >= 0;
                    const isRowHovered = hoveredTableSymbol === s.symbol || openDropdownSymbol === s.symbol;

                    return (
                      <tr
                        key={s.symbol}
                        onMouseEnter={() => setHoveredTableSymbol(s.symbol)}
                        onMouseLeave={() => {
                          if (openDropdownSymbol !== s.symbol) {
                            setHoveredTableSymbol(null);
                          }
                        }}
                        onClick={() => {
                          if (onSelectStock) onSelectStock(s);
                          else {
                            setSelectedScrip(s);
                            setViewMode('chart');
                          }
                        }}
                        className={`transition-colors cursor-pointer group relative ${
                          isRowHovered ? 'bg-[#FFF9F2]' : 'hover:bg-gray-50/70'
                        }`}
                      >
                        {/* Name + Logo + Floating Quick Action Bar */}
                        <td className="py-3.5 px-4 relative">
                          <div className="flex items-center gap-2.5">
                            <CompanyLogo name={s.name} size={28} />
                            <div>
                              <span className="font-semibold text-gray-900 group-hover:text-[#603DC8] transition-colors block">
                                {s.name}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium uppercase">
                                {s.exchange || 'NSE'}
                              </span>
                            </div>
                          </div>

                          {/* Floating Quick Action Bar matching User Screenshot 1:1 */}
                          {isRowHovered && !isEditMode && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-6 top-[calc(100%-8px)] z-40 bg-white rounded-xl shadow-xl border border-gray-200/90 p-1 flex items-center gap-1.5 animate-in fade-in duration-100"
                            >
                              {/* Upward pointing arrow/caret */}
                              <div className="absolute -top-[5px] left-4 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-white" />
                              <div className="absolute -top-[6px] left-4 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-gray-200 -z-10" />

                              {/* B (Buy) Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOrderPanel(s, 'BUY');
                                }}
                                className="w-6 h-6 rounded-md border border-[#00BE5C] bg-[#ECFDF3] text-[#00BE5C] hover:bg-[#00BE5C] hover:text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                title="Buy"
                              >
                                B
                              </button>

                              {/* S (Sell) Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOrderPanel(s, 'SELL');
                                }}
                                className="w-6 h-6 rounded-md border border-[#F72F53] bg-[#FEF3F2] text-[#F72F53] hover:bg-[#F72F53] hover:text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                title="Sell"
                              >
                                S
                              </button>

                              {/* Price Alert Clock Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showQuickToast(`🔔 Price alert (02) set for ${s.name} at ₹${s.ltp}`);
                                }}
                                className="w-6 h-6 rounded-md text-[#603DC8] hover:bg-[#603DC8]/10 flex items-center justify-center transition-colors cursor-pointer"
                                title="Set Price Alert"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>

                              {/* Chart Icon Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedScrip(s);
                                  setViewMode('chart');
                                }}
                                className="w-6 h-6 rounded-md text-[#603DC8] hover:bg-[#603DC8]/10 flex items-center justify-center transition-colors cursor-pointer"
                                title="View Chart"
                              >
                                <BarChart2 className="w-3.5 h-3.5" />
                              </button>

                              {/* 3 Dots Vertical Menu Button */}
                              <div className="relative" ref={openDropdownSymbol === s.symbol ? dropdownRef : null}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownSymbol((prev) => (prev === s.symbol ? null : s.symbol));
                                  }}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                                    openDropdownSymbol === s.symbol
                                      ? 'bg-[#603DC8] text-white shadow-xs'
                                      : 'text-[#603DC8] hover:bg-[#603DC8]/10'
                                  }`}
                                  title="More Actions"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* 8-Item Dropdown Menu matching Screenshot 1:1 */}
                                {openDropdownSymbol === s.symbol && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-50"
                                  >
                                    <div className="py-1">
                                      {/* 1. Price Alert (02) */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          showQuickToast(`🔔 Price alert (02) active for ${s.name}`);
                                          setOpenDropdownSymbol(null);
                                        }}
                                        className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                      >
                                        <Clock className="w-4 h-4 text-[#603DC8] shrink-0" />
                                        <span>Price Alert (02)</span>
                                      </button>

                                      {/* 2. Share Scrip */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (typeof window !== 'undefined' && navigator.clipboard) {
                                            navigator.clipboard.writeText(`${window.location.origin}/#/stock/${s.symbol}`);
                                          }
                                          showQuickToast(`🔗 Link to ${s.name} copied to clipboard!`);
                                          setOpenDropdownSymbol(null);
                                        }}
                                        className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                      >
                                        <Share2 className="w-4 h-4 text-[#603DC8] shrink-0" />
                                        <span>Share Scrip</span>
                                      </button>

                                      {/* 3. SIP Order */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          showQuickToast(`📅 Stock SIP scheduled for ${s.name}`);
                                          setOpenDropdownSymbol(null);
                                        }}
                                        className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                      >
                                        <Calendar className="w-4 h-4 text-[#603DC8] shrink-0" />
                                        <span>SIP Order</span>
                                      </button>

                                      {/* 4. Add to Basket */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          showQuickToast(`🛍️ ${s.name} added to your basket!`);
                                          setOpenDropdownSymbol(null);
                                        }}
                                        className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                      >
                                        <ShoppingBag className="w-4 h-4 text-[#603DC8] shrink-0" />
                                        <span>Add to Basket</span>
                                      </button>

                                      {/* 5. PIN to Header */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          showQuickToast(`📌 ${s.name} pinned to header ticker!`);
                                          setOpenDropdownSymbol(null);
                                        }}
                                        className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                      >
                                        <Pin className="w-4 h-4 text-[#603DC8] shrink-0" />
                                        <span>PIN to Header</span>
                                      </button>

                                      {/* 6. Show Option Chain */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (onSelectStock) {
                                            onSelectStock({ ...s, defaultTab: 'option_chain' });
                                          } else if (typeof window !== 'undefined') {
                                            window.location.hash = `#/stock/${s.symbol}?tab=option_chain`;
                                          }
                                          setOpenDropdownSymbol(null);
                                        }}
                                        className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                      >
                                        <Link className="w-4 h-4 text-[#603DC8] shrink-0" />
                                        <span>Show Option Chain</span>
                                      </button>

                                      {/* 7. Gift Shares */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          showQuickToast(`🎁 Gift Shares transfer flow opened for ${s.name}`);
                                          setOpenDropdownSymbol(null);
                                        }}
                                        className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                      >
                                        <Gift className="w-4 h-4 text-[#603DC8] shrink-0" />
                                        <span>Gift Shares</span>
                                      </button>
                                    </div>

                                    {/* 8. Remove from Watchlist */}
                                    <div className="py-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          handleRemoveStock(s.symbol, e);
                                          showQuickToast(`🗑️ ${s.name} removed from watchlist`);
                                          setOpenDropdownSymbol(null);
                                        }}
                                        className="w-full px-3.5 py-2 flex items-center gap-2.5 text-xs font-medium text-[#F72F53] hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer text-left"
                                      >
                                        <Trash2 className="w-4 h-4 text-[#F72F53] shrink-0" />
                                        <span>Remove from Watchlist</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Symbol */}
                        <td className="py-3.5 px-4 font-medium text-gray-600 uppercase">
                          {s.symbol}
                        </td>

                        {/* Volume */}
                        <td className="py-3.5 px-4 font-medium text-gray-800">
                          {s.volume}
                        </td>

                        {/* LTP */}
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          ₹ {Number(s.ltp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Change */}
                        <td className={`py-3.5 px-4 font-medium ${isPositive ? 'text-[#00BE5C]' : 'text-[#F72F53]'}`}>
                          {isPositive ? '+ ' : '- '}₹{Math.abs(s.change).toFixed(2)}
                        </td>

                        {/* % Change */}
                        <td className={`py-3.5 px-4 font-medium ${isPositive ? 'text-[#00BE5C]' : 'text-[#F72F53]'}`}>
                          {isPositive ? '+ ' : '- '}{Math.abs(s.percentChange).toFixed(2)}%
                        </td>

                        {/* Open */}
                        <td className="py-3.5 px-4 font-medium text-gray-700">
                          ₹ {Number(s.open).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Prev-Close */}
                        <td className="py-3.5 px-4 font-medium text-gray-700">
                          ₹ {Number(s.prevClose).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Edit Mode Remove Button */}
                        {isEditMode && (
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => handleRemoveStock(s.symbol, e)}
                              className="p-1.5 rounded-lg bg-red-50 text-[#F72F53] hover:bg-red-100 transition-colors cursor-pointer"
                              title="Remove from watchlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Unified Right Order Panel Modal for direct Buy/Sell */}
      {orderDrawer.isOpen && (
        <RightOrderPanel
          stock={orderDrawer.stock || activeStock}
          action={orderDrawer.action}
          initialProductType="Long-term"
          onClose={() => setOrderDrawer({ isOpen: false, stock: null, action: 'BUY' })}
          onSubmitOrder={handleOrderSubmitted}
        />
      )}

      {/* Add Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-base">
                  Add Stocks to {activeTab}
                </h3>
                <p className="text-xs text-gray-500">
                  Select any stock from market data to add to this watchlist
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by company name or symbol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#FF7A00]"
                  autoFocus
                />
              </div>
            </div>

            {/* Available Stocks List */}
            <div className="flex-1 overflow-y-auto p-3 divide-y divide-gray-100 no-scrollbar">
              {availableToAdd.map((stock) => (
                <div
                  key={stock.symbol}
                  className="py-2.5 px-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <CompanyLogo name={stock.name} size={28} />
                    <div>
                      <span className="font-semibold text-gray-900 text-xs block">
                        {stock.name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {stock.symbol} • ₹{stock.lastTradedPrice}
                      </span>
                    </div>
                  </div>

                  {stock.isAlreadyAdded ? (
                    <span className="text-[11px] text-gray-400 font-medium px-3 py-1 bg-gray-100 rounded-full">
                      Added
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddStock(stock)}
                      className="px-3 py-1 rounded-full bg-[#FF7A00] hover:bg-[#E06D00] text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-right">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Figma 1:1 Filter & Sort Drawer (Node ID: 7737:52410) */}
      <FilterSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        context="watchlist"
        activeSort={activeSort}
        onApplySort={(sort) => setActiveSort(sort)}
        activeFilters={activeFilters}
        onApplyFilters={(filters) => setActiveFilters(filters)}
        onReset={() => {
          setActiveSort({ field: null, order: 'desc' });
          setActiveFilters({});
        }}
      />

      {/* Figma 1:1 Manage Watchlist Modal (Node ID: 6480:9284 / Image 2) */}
      <ManageWatchlistModal
        isOpen={isManageWatchlistOpen}
        onClose={() => setIsManageWatchlistOpen(false)}
        watchlists={currentWatchlists}
        onCreateWatchlist={handleCreateWatchlist}
        onRenameWatchlist={handleRenameWatchlist}
        onDeleteWatchlist={handleDeleteWatchlist}
      />

      {/* Floating Action Feedback Toast */}
      {quickToast && (
        <div className="fixed bottom-6 right-6 z-[140] bg-gray-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-[#00BE5C]" />
          <span>{quickToast}</span>
        </div>
      )}
    </div>
  );
};

export default WatchlistDashboard;
