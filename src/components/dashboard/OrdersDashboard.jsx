import { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  Search,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  ArrowRight,
  Info,
} from 'lucide-react';
import CompanyLogo from '../common/CompanyLogo';
import FilterSidebar from '../common/FilterSidebar';

export const OrdersDashboard = ({
  orders = [],
  onSelectStock,
  onCancelAllOrders,
}) => {
  const [activeSubTab, setActiveSubTab] = useState('regular'); // 'regular' | 'gtt' | 'sip' | 'basket'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Open' | 'Closed'
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelToast, setCancelToast] = useState(false);

  // Figma 1:1 Filter & Sort state (Node ID: 8122:58125 / 7737:52410)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [activeSort, setActiveSort] = useState({ field: null, order: 'desc' });
  const [activeFilters, setActiveFilters] = useState({});

  // Status badge styling helper matching Figma 1:1
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Executed':
        return (
          <span className="inline-flex items-center gap-1 bg-[#D2F9E5] text-[#00BE5C] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            Executed
          </span>
        );
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 bg-[#FEF7CE] text-[#B54708] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            Open
          </span>
        );
      case 'Partially Executed':
        return (
          <span className="inline-flex items-center gap-1 bg-[#FEF7CE] text-[#B54708] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            Partially Executed
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-[#FEE2E2] text-[#F72F53] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            <span>Rejected</span>
            <Info className="w-3 h-3 ml-0.5" />
          </span>
        );
      case 'Cancelled':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            <span>Cancelled</span>
            <Info className="w-3 h-3 ml-0.5" />
          </span>
        );
    }
  };

  // Filter and sort orders by tab, status filter, search text, and Figma sidebar options
  const filteredOrders = useMemo(() => {
    let result = orders.filter((o) => {
      // Status pill filter
      if (statusFilter === 'Open') {
        if (o.status !== 'Open' && o.status !== 'Partially Executed') return false;
      } else if (statusFilter === 'Closed') {
        if (o.status === 'Open' || o.status === 'Partially Executed') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = o.name?.toLowerCase().includes(q);
        const matchSym = o.symbol?.toLowerCase().includes(q);
        const matchTag = o.tag?.toLowerCase().includes(q);
        if (!matchName && !matchSym && !matchTag) return false;
      }

      // Exchange Filter
      if (activeFilters.exchange?.length) {
        if (!activeFilters.exchange.includes(o.exchange || 'NSE')) return false;
      }

      // Segment Filter
      if (activeFilters.segment?.length) {
        const seg = o.segment || (o.symbol?.includes('FUT') || o.symbol?.includes('CE') ? 'F&O' : 'Equity');
        if (!activeFilters.segment.includes(seg)) return false;
      }

      // Product Type Filter
      if (activeFilters.productType?.length) {
        if (!activeFilters.productType.includes(o.productType || 'Delivery')) return false;
      }

      // Status Filter from drawer
      if (activeFilters.status?.length) {
        if (!activeFilters.status.includes(o.status)) return false;
      }

      return true;
    });

    // Sort by field
    if (activeSort.field) {
      result.sort((a, b) => {
        if (activeSort.field === 'alphabetical') {
          const nameA = a.name || a.symbol || '';
          const nameB = b.name || b.symbol || '';
          return activeSort.order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        if (activeSort.field === 'ltp') {
          const pA = Number(a.unitPrice || a.price || 0);
          const pB = Number(b.unitPrice || b.price || 0);
          return activeSort.order === 'asc' ? pA - pB : pB - pA;
        }
        if (activeSort.field === 'invested') {
          const valA = Number(a.orderValue || 0);
          const valB = Number(b.orderValue || 0);
          return activeSort.order === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }

    return result;
  }, [orders, statusFilter, searchQuery, activeFilters, activeSort]);

  const handleCancelAll = () => {
    if (onCancelAllOrders) {
      onCancelAllOrders();
    }
    setCancelToast(true);
    setTimeout(() => {
      setCancelToast(false);
    }, 2200);
  };

  return (
    <div className="w-full select-none font-['Poppins',sans-serif] space-y-3">
      {/* 1. White Background Container for Orders Heading & Subtabs (Figma 1:1 Match) */}
      <div className="bg-white rounded-xl border border-gray-100/90 shadow-2xs px-4 pt-3.5 pb-0">
        <div className="pb-2">
          <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Orders
          </h1>
        </div>

        {/* 2. Orders Subtabs: Regular | GTT | SIP | Basket */}
        <div className="border-b border-gray-100 flex items-center gap-6 text-xs font-medium overflow-x-auto no-scrollbar">
          {[
            { id: 'regular', label: 'Regular' },
            { id: 'gtt', label: 'GTT' },
            { id: 'sip', label: 'SIP' },
            { id: 'basket', label: 'Basket' },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`relative py-2.5 cursor-pointer transition-colors whitespace-nowrap ${
                  isActive ? 'text-[#603DC8] font-semibold' : 'text-gray-500 hover:text-gray-900'
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
      </div>

      {cancelToast && (
        <div className="bg-[#FEF7CE] text-[#9A3412] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <Ban className="w-4 h-4 text-[#C35B05]" />
          <span>All active open orders have been cancelled.</span>
        </div>
      )}

      {/* 3. Filter Bar: Equalizer Button, All | Open | Closed Pills, Search, Cancel All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Equalizer Icon Button (Figma 1:1 Filter & Sort Drawer Trigger) */}
          <button
            type="button"
            onClick={() => setIsFilterSidebarOpen(true)}
            className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              activeSort.field || Object.values(activeFilters).some((arr) => arr?.length > 0)
                ? 'bg-[#FF7A00] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="Filter and Sort orders"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {(activeSort.field || Object.values(activeFilters).some((arr) => arr?.length > 0)) && (
              <span className="text-[10px]">Filtered</span>
            )}
          </button>

          {/* Status Filter Pills: All | Open | Closed */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1">
            {['All', 'Open', 'Closed'].map((s) => {
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FF7A00] w-36 sm:w-44"
            />
          </div>
        </div>

        {/* Cancel All Button (Figma 1:1 Match) */}
        <button
          type="button"
          onClick={handleCancelAll}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold border border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00]/10 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Cancel All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Orders Data Table (Figma 1:1 Match) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-[11px] font-medium bg-gray-50/50">
                <th className="py-3.5 px-4 font-medium">Name</th>
                <th className="py-3.5 px-4 font-medium">Type</th>
                <th className="py-3.5 px-4 font-medium">Qty</th>
                <th className="py-3.5 px-4 font-medium">Status</th>
                <th className="py-3.5 px-4 font-medium">Unit Price</th>
                <th className="py-3.5 px-4 font-medium text-right">Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400 text-xs">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isBuy = (o.action || 'BUY').toUpperCase() === 'BUY';
                  const filledQtyFormatted = `${String(o.filledQty || 0).padStart(2, '0')}/${String(o.totalQty || o.qty || 0)}`;

                  return (
                    <tr
                      key={o.id}
                      onClick={() => onSelectStock && onSelectStock(o)}
                      className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Name + Subtitle (Tag or Exchange • Product • Type) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <CompanyLogo name={o.name} size={28} />
                          <div>
                            <span className="font-semibold text-gray-900 group-hover:text-[#603DC8] transition-colors block">
                              {o.name || o.displayName}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {o.tag || `${o.exchange || 'NSE'} • ${o.productType || 'Delivery'} • ${o.orderType || 'Limit'}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type: BUY (green) or SELL (red) */}
                      <td className="py-3.5 px-4 font-semibold">
                        <span className={isBuy ? 'text-[#00BE5C]' : 'text-[#F72F53]'}>
                          {isBuy ? 'BUY' : 'SELL'}
                        </span>
                      </td>

                      {/* Qty (e.g. 00/12, 20/20, 8000/8000) */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {filledQtyFormatted}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(o.status)}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {o.unitPrice ? `₹${Number(o.unitPrice).toFixed(2)}` : '--'}
                      </td>

                      {/* Order Value */}
                      <td className="py-3.5 px-4 font-medium text-gray-900 text-right">
                        {o.orderValue ? `₹${Number(o.orderValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '--'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Figma 1:1 Filter & Sort Drawer (Node ID: 8122:58125 / 7737:52410) */}
      <FilterSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        context="orders"
        activeSort={activeSort}
        onApplySort={setActiveSort}
        activeFilters={activeFilters}
        onApplyFilters={setActiveFilters}
        onReset={() => {
          setActiveSort({ field: null, order: 'desc' });
          setActiveFilters({});
        }}
      />
    </div>
  );
};

export default OrdersDashboard;

