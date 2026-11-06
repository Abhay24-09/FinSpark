import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  BarChart3,
  X,
  Info,
} from 'lucide-react';
import {
  fetchBhavcopyStocks,
  fetchBhavcopySummary,
  refreshBhavcopy,
  formatIndianCurrency,
  formatIndianNumber,
} from '../../services/bhavcopyApi';
import CompanyLogo from '../common/CompanyLogo';
import Badge from '../common/Badge';

export const BhavcopyDashboard = ({ searchQuery: externalSearch = '', onSelectStock }) => {
  const [summary, setSummary] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [tradingDate, setTradingDate] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [activeSeries, setActiveSeries] = useState('EQ');
  const [prevExternalSearch, setPrevExternalSearch] = useState(externalSearch);
  const [searchQuery, setSearchQuery] = useState(externalSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(externalSearch);

  // Sync external search during render (React-recommended pattern)
  if (externalSearch !== prevExternalSearch) {
    setPrevExternalSearch(externalSearch);
    setSearchQuery(externalSearch);
  }

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalStocks, setTotalStocks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeMoversTab, setActiveMoversTab] = useState('gainers');
  const [selectedStock, setSelectedStock] = useState(null);

  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Market Summary when selectedDate changes
  useEffect(() => {
    let ignore = false;
    async function loadSummaryData() {
      try {
        const res = await fetchBhavcopySummary(selectedDate);
        if (!ignore && res.success && res.summary) {
          setSummary(res.summary);
          setTradingDate(res.summary.tradingDate);
          setErrorMessage('');
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load summary:', err);
          setErrorMessage(err.message || 'Failed to connect to NSE Bhavcopy server.');
        }
      } finally {
        if (!ignore) {
          setIsLoadingSummary(false);
        }
      }
    }

    loadSummaryData();
    return () => {
      ignore = true;
    };
  }, [selectedDate]);

  // Load Paginated Stocks
  const loadStocks = useCallback(async () => {
    setIsLoadingTable(true);
    try {
      const res = await fetchBhavcopyStocks({
        date: selectedDate || undefined,
        series: activeSeries,
        search: debouncedSearch,
        page,
        limit,
        sort: sortField,
        order: sortOrder,
      });

      if (res.success) {
        setStocks(res.data || []);
        setTotalStocks(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.tradingDate) {
          setTradingDate(res.tradingDate);
        }
        setErrorMessage('');
      }
    } catch (err) {
      console.error('Failed to load stocks:', err);
      setErrorMessage(err.message || 'Error fetching stocks data.');
      setStocks([]);
    } finally {
      setIsLoadingTable(false);
    }
  }, [selectedDate, activeSeries, debouncedSearch, page, limit, sortField, sortOrder]);

  useEffect(() => {
    let ignore = false;
    async function loadTableData() {
      try {
        const res = await fetchBhavcopyStocks({
          date: selectedDate || undefined,
          series: activeSeries,
          search: debouncedSearch,
          page,
          limit,
          sort: sortField,
          order: sortOrder,
        });

        if (!ignore && res.success) {
          setStocks(res.data || []);
          setTotalStocks(res.total || 0);
          setTotalPages(res.totalPages || 1);
          if (res.tradingDate) {
            setTradingDate(res.tradingDate);
          }
          setErrorMessage('');
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load stocks:', err);
          setErrorMessage(err.message || 'Error fetching stocks data.');
          setStocks([]);
        }
      } finally {
        if (!ignore) {
          setIsLoadingTable(false);
        }
      }
    }

    loadTableData();
    return () => {
      ignore = true;
    };
  }, [selectedDate, activeSeries, debouncedSearch, page, limit, sortField, sortOrder]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await refreshBhavcopy();
      if (res.success && res.summary) {
        setSummary(res.summary);
        setTradingDate(res.tradingDate);
        await loadStocks();
      }
    } catch (err) {
      console.error('Refresh error:', err);
      await loadStocks();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc'); // default to descending for financial metrics
    }
    setPage(1);
  };

  // Active movers list based on selected tab
  const activeMoversList = useMemo(() => {
    if (!summary) return [];
    switch (activeMoversTab) {
      case 'gainers':
        return summary.top10Gainers || [];
      case 'losers':
        return summary.top10Losers || [];
      case 'volume':
        return summary.highestVolume || [];
      case 'value':
        return summary.highestValue || [];
      default:
        return summary.top10Gainers || [];
    }
  }, [summary, activeMoversTab]);

  return (
    <div className="space-y-3">
      {/* 1. Header Banner & Controls Bar */}
      <div className="bg-card-bg rounded-xl border border-card-border p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Title & Report Metadata */}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-text-main tracking-tight">
                NSE Bhavcopy (CM-UDiFF Market Data)
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Official NSE Report
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Capital Market Unified Distilled File Format (CM-UDiFF) • Traded Securities
            </p>
          </div>

          {/* Date Selector & Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Trading Date Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-card-border text-xs text-text-main">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-text-muted">Trading Date:</span>
              <span className="font-bold text-primary">
                {tradingDate || 'Loading...'}
              </span>
            </div>

            {/* Date Input for Historical Bhavcopy */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-card-bg border border-card-border rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              title="Select trading date (YYYY-MM-DD)"
            />

            {selectedDate && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('');
                  setPage(1);
                }}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Reset to Latest
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="mt-3 p-2.5 bg-danger-bg border border-danger-border rounded-lg text-xs text-danger flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setErrorMessage('');
                loadStocks();
              }}
              className="underline font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* 2. Market Overview 4-Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Total Stocks */}
        <div className="bg-card-bg rounded-xl border border-card-border p-3 shadow-xs">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span className="font-semibold">Total Stocks Traded</span>
            <Layers className="w-4 h-4 text-primary/70" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-text-main mt-1">
            {isLoadingSummary ? (
              <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded" />
            ) : (
              formatIndianNumber(summary?.totalStocks || 0)
            )}
          </div>
          <div className="text-[11px] text-text-light font-medium mt-0.5">
            Equity (EQ) Series Traded
          </div>
        </div>

        {/* Advancers */}
        <div className="bg-card-bg rounded-xl border border-card-border p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-semibold">Advancers</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-success mt-1">
            {isLoadingSummary ? (
              <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded" />
            ) : (
              formatIndianNumber(summary?.advancers || 0)
            )}
          </div>
          <div className="text-[11px] text-text-light font-medium mt-0.5">
            {summary?.totalStocks
              ? `${((summary.advancers / summary.totalStocks) * 100).toFixed(1)}% of market`
              : 'Positive change'}
          </div>
        </div>

        {/* Decliners */}
        <div className="bg-card-bg rounded-xl border border-card-border p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-semibold">Decliners</span>
            <TrendingDown className="w-4 h-4 text-danger" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-danger mt-1">
            {isLoadingSummary ? (
              <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded" />
            ) : (
              formatIndianNumber(summary?.decliners || 0)
            )}
          </div>
          <div className="text-[11px] text-text-light font-medium mt-0.5">
            {summary?.totalStocks
              ? `${((summary.decliners / summary.totalStocks) * 100).toFixed(1)}% of market`
              : 'Negative change'}
          </div>
        </div>

        {/* Unchanged */}
        <div className="bg-card-bg rounded-xl border border-card-border p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-semibold">Unchanged</span>
            <Minus className="w-4 h-4 text-text-muted" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-text-main mt-1">
            {isLoadingSummary ? (
              <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded" />
            ) : (
              formatIndianNumber(summary?.unchanged || 0)
            )}
          </div>
          <div className="text-[11px] text-text-light font-medium mt-0.5">
            {summary?.totalStocks
              ? `${((summary.unchanged / summary.totalStocks) * 100).toFixed(1)}% flat`
              : 'Zero net change'}
          </div>
        </div>
      </div>

      {/* 3. Market Movers Cards (Top 10 Gainers, Losers, Highest Volume, Turnover) */}
      <div className="bg-card-bg rounded-xl border border-card-border p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-card-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-text-main">Market Movers (Top 10)</h3>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
            {[
              { id: 'gainers', label: 'Top Gainers' },
              { id: 'losers', label: 'Top Losers' },
              { id: 'volume', label: 'Highest Volume' },
              { id: 'value', label: 'Highest Value' },
            ].map((tab) => {
              const isActive = activeMoversTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMoversTab(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-card-bg text-primary shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontal scroll cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-2.5">
          {isLoadingSummary ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl animate-pulse h-20" />
            ))
          ) : activeMoversList.length > 0 ? (
            activeMoversList.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => {
                  setSelectedStock(stock);
                  setSearchQuery(stock.symbol);
                }}
                className="p-2.5 bg-gray-50/70 hover:bg-gray-100/80 border border-card-border rounded-xl transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-text-main group-hover:text-primary transition-colors truncate">
                    {stock.symbol}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      stock.change >= 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {stock.change >= 0 ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-[10px] text-text-muted truncate mt-0.5">
                  {stock.name}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="font-semibold text-text-main">
                    ₹{stock.close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-text-light">
                    Vol: {formatIndianNumber(stock.volume)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-4 text-center text-xs text-text-muted">
              No movers data available for this date.
            </div>
          )}
        </div>
      </div>

      {/* 4. Complete NSE Stock Data Table */}
      <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
        {/* Table Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-card-border">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search stocks by symbol (e.g. RELIANCE, TCS) or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-card-border rounded-lg text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card-bg transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Series & Rows per page controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Series Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-text-muted font-medium">Series:</span>
              <select
                value={activeSeries}
                onChange={(e) => {
                  setActiveSeries(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 text-xs bg-gray-50 border border-card-border rounded-lg text-text-main font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="EQ">EQ (Equity)</option>
                <option value="BE">BE (Book Entry)</option>
                <option value="SM">SM (SME)</option>
                <option value="ALL">ALL (All Series)</option>
              </select>
            </div>

            {/* Rows per page */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-text-muted font-medium">Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 text-xs bg-gray-50 border border-card-border rounded-lg text-text-main font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="overflow-x-auto no-scrollbar mt-2">
          <table className="w-full border-collapse text-left text-xs min-w-[840px]">
            <thead>
              <tr className="border-b border-card-border text-[11px] text-text-light font-semibold uppercase tracking-wider select-none bg-gray-50/60">
                <th
                  onClick={() => handleSort('symbol')}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-main transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Symbol</span>
                    {sortField === 'symbol' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-3">Series</th>
                <th
                  onClick={() => handleSort('open')}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-main transition-colors"
                >
                  Open
                </th>
                <th
                  onClick={() => handleSort('high')}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-main transition-colors"
                >
                  High
                </th>
                <th
                  onClick={() => handleSort('low')}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-main transition-colors"
                >
                  Low
                </th>
                <th
                  onClick={() => handleSort('previousClose')}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-main transition-colors"
                >
                  Prev Close
                </th>
                <th
                  onClick={() => handleSort('close')}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-main transition-colors font-bold"
                >
                  <div className="flex items-center gap-1">
                    <span>Close</span>
                    {sortField === 'close' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('change')}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-main transition-colors"
                >
                  Change
                </th>
                <th
                  onClick={() => handleSort('changePercent')}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-main transition-colors font-bold"
                >
                  <div className="flex items-center gap-1">
                    <span>Change %</span>
                    {sortField === 'changePercent' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('volume')}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-main transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Volume</span>
                    {sortField === 'volume' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tradedValue')}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-main transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Traded Value</span>
                    {sortField === 'tradedValue' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingTable ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={11} className="py-3 px-3">
                      <div className="h-5 bg-gray-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : stocks.length > 0 ? (
                stocks.map((stock) => (
                  <tr
                    key={`${stock.symbol}-${stock.series}`}
                    onClick={() => {
                      if (onSelectStock) {
                        onSelectStock(stock);
                      } else {
                        setSelectedStock(stock);
                      }
                    }}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Symbol & Security Name */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo name={stock.symbol} size={28} />
                        <div className="min-w-0">
                          <div className="font-bold text-text-main group-hover:text-primary transition-colors">
                            {stock.symbol}
                          </div>
                          <div className="text-[10px] text-text-muted truncate max-w-[180px]">
                            {stock.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Series */}
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-text-muted">
                        {stock.series}
                      </span>
                    </td>

                    {/* Open */}
                    <td className="py-2 px-3 font-medium text-text-main">
                      ₹{stock.open.toFixed(2)}
                    </td>

                    {/* High */}
                    <td className="py-2 px-3 font-medium text-text-main">
                      ₹{stock.high.toFixed(2)}
                    </td>

                    {/* Low */}
                    <td className="py-2 px-3 font-medium text-text-main">
                      ₹{stock.low.toFixed(2)}
                    </td>

                    {/* Previous Close */}
                    <td className="py-2 px-3 font-medium text-text-muted">
                      ₹{stock.previousClose.toFixed(2)}
                    </td>

                    {/* Close Price */}
                    <td className="py-2 px-3 font-bold text-text-main whitespace-nowrap">
                      ₹{stock.close.toFixed(2)}
                    </td>

                    {/* Change */}
                    <td
                      className={`py-2 px-3 font-semibold whitespace-nowrap ${
                        stock.change >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {stock.change >= 0 ? '+' : ''}₹{stock.change.toFixed(2)}
                    </td>

                    {/* Change % */}
                    <td
                      className={`py-2 px-3 font-bold whitespace-nowrap ${
                        stock.changePercent >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {stock.changePercent >= 0 ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </td>

                    {/* Volume */}
                    <td className="py-2 px-3 font-medium text-text-main whitespace-nowrap">
                      {formatIndianNumber(stock.volume)}
                    </td>

                    {/* Traded Value */}
                    <td className="py-2 px-3 font-semibold text-text-main whitespace-nowrap">
                      {formatIndianCurrency(stock.tradedValue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-text-muted">
                    <p className="font-semibold text-sm text-text-main">No stocks found</p>
                    <p className="mt-1">
                      {searchQuery
                        ? `No securities matching "${searchQuery}" in ${activeSeries} series.`
                        : 'No Bhavcopy records available for the selected parameters.'}
                    </p>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mt-2 px-3 py-1 bg-primary text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Clear Search
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-card-border mt-2 text-xs">
          <div className="text-text-muted">
            Showing{' '}
            <span className="font-bold text-text-main">
              {totalStocks > 0 ? (page - 1) * limit + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-bold text-text-main">
              {Math.min(page * limit, totalStocks)}
            </span>{' '}
            of <span className="font-bold text-text-main">{formatIndianNumber(totalStocks)}</span> stocks
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-card-border hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-text-main"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-semibold text-text-main">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-card-border hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-text-main"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Stock Detail Modal */}
      {selectedStock && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedStock(null)}
        >
          <div
            className="bg-card-bg border border-card-border rounded-2xl p-5 max-w-lg w-full shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-card-border">
              <div className="flex items-center gap-3">
                <CompanyLogo name={selectedStock.symbol} size={42} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text-main">
                      {selectedStock.symbol}
                    </h3>
                    <Badge variant="purple" className="text-[10px]">
                      {selectedStock.series}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {selectedStock.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStock(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text-main cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price & Change strip */}
            <div className="flex items-baseline justify-between py-3 border-b border-card-border">
              <div>
                <span className="text-xs text-text-muted">Closing Price:</span>
                <div className="text-2xl font-black text-text-main">
                  ₹{selectedStock.close.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-base font-bold ${
                    selectedStock.change >= 0 ? 'text-success' : 'text-danger'
                  }`}
                >
                  {selectedStock.change >= 0 ? '+' : ''}₹{selectedStock.change.toFixed(2)} (
                  {selectedStock.change >= 0 ? '+' : ''}
                  {selectedStock.changePercent.toFixed(2)}%)
                </div>
                <div className="text-[11px] text-text-light">
                  Prev Close: ₹{selectedStock.previousClose.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Key UDiFF Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 text-xs">
              <div>
                <span className="text-[11px] text-text-light">Open</span>
                <div className="font-semibold text-text-main">₹{selectedStock.open.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[11px] text-text-light">Day High</span>
                <div className="font-semibold text-text-main">₹{selectedStock.high.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[11px] text-text-light">Day Low</span>
                <div className="font-semibold text-text-main">₹{selectedStock.low.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[11px] text-text-light">Last Traded Price</span>
                <div className="font-semibold text-text-main">₹{selectedStock.lastPrice.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[11px] text-text-light">Settlement Price</span>
                <div className="font-semibold text-text-main">₹{selectedStock.settlementPrice.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[11px] text-text-light">Calculated VWAP</span>
                <div className="font-semibold text-primary">₹{selectedStock.vwap.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[11px] text-text-light">Total Traded Volume</span>
                <div className="font-semibold text-text-main">{formatIndianNumber(selectedStock.volume)}</div>
              </div>
              <div>
                <span className="text-[11px] text-text-light">Traded Turnover</span>
                <div className="font-semibold text-text-main">{formatIndianCurrency(selectedStock.tradedValue)}</div>
              </div>
              <div>
                <span className="text-[11px] text-text-light">Number of Trades</span>
                <div className="font-semibold text-text-main">{formatIndianNumber(selectedStock.trades)}</div>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="mt-2 pt-2.5 border-t border-card-border flex flex-col gap-1 text-[11px] text-text-muted">
              <div className="flex justify-between">
                <span>ISIN:</span>
                <span className="font-mono font-semibold text-text-main">{selectedStock.isin}</span>
              </div>
              <div className="flex justify-between">
                <span>Trading Date:</span>
                <span className="font-semibold text-text-main">{selectedStock.tradingDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Deliverable Qty:</span>
                <span className="italic text-text-light">Published in separate NSE MTO report</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BhavcopyDashboard;
