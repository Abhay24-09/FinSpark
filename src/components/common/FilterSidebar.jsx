import { useState } from 'react';
import { X, ArrowUpDown, Filter as FilterIcon, Check } from 'lucide-react';

/**
 * FilterSidebar
 * ---------------------------------------------------------------------------
 * Figma 1:1 Implementation of the Filter & Sort Drawer (Node ID: 7737:52410):
 * - Triggered by the three horizontal bars / sliders icon across Watchlist,
 *   Positions, Orders, and Holdings.
 * - Tabs:
 *    1. "Sort_by": Alphabetically (A-Z/Z-A), LTP, Unrealized PnL, LTP Change, ATP, Invested Amount
 *    2. "Filter": Exchange (NSE/BSE), Segment (Equity/FnO/Commodity), Market Cap (Large/Mid/Small),
 *       Status (Profit/Loss or Open/Executed), Product Type (Delivery/Intraday/MTF)
 * - Pinned Bottom CTA Bar: "Reset" and "Apply" buttons
 */
export const FilterSidebar = ({
  isOpen,
  onClose,
  context = 'general', // 'watchlist' | 'positions' | 'orders' | 'holdings'
  activeSort = { field: null, order: 'desc' },
  onApplySort,
  activeFilters = {},
  onApplyFilters,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState('sort_by'); // 'sort_by' | 'filter'

  // Local state until Apply is clicked
  const [selectedSort, setSelectedSort] = useState(activeSort);
  const [selectedFilters, setSelectedFilters] = useState(activeFilters);

  if (!isOpen) return null;

  const handleSortSelect = (field, order) => {
    if (selectedSort.field === field && selectedSort.order === order) {
      // Toggle off if already active
      setSelectedSort({ field: null, order: 'desc' });
    } else {
      setSelectedSort({ field, order });
    }
  };

  const handleFilterToggle = (category, value) => {
    setSelectedFilters((prev) => {
      const currentList = prev[category] || [];
      const exists = currentList.includes(value);
      const updated = exists
        ? currentList.filter((item) => item !== value)
        : [...currentList, value];
      return { ...prev, [category]: updated };
    });
  };

  const handleApply = () => {
    if (onApplySort) onApplySort(selectedSort);
    if (onApplyFilters) onApplyFilters(selectedFilters);
    if (onClose) onClose();
  };

  const handleResetInternal = () => {
    const defaultSort = { field: null, order: 'desc' };
    const defaultFilters = {};
    setSelectedSort(defaultSort);
    setSelectedFilters(defaultFilters);
    if (onReset) onReset();
  };

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[85] transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Side Sliding Drawer */}
      <div className="fixed top-0 right-0 bottom-0 h-screen w-full sm:w-[380px] md:w-[400px] bg-white border-l border-gray-200/90 shadow-2xl flex flex-col justify-between z-[90] select-none animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>Filters</span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Figma Tab Switcher: Sort_by vs. Filter */}
          <div className="bg-[#F6F6F6] p-1 rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('sort_by')}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'sort_by'
                  ? 'bg-white text-gray-900 font-bold shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort_by</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('filter')}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'filter'
                  ? 'bg-white text-gray-900 font-bold shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FilterIcon className="w-3.5 h-3.5" />
              <span>Filter</span>
              {Object.values(selectedFilters).flat().length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#FF6900]" />
              )}
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar">
          {activeTab === 'sort_by' ? (
            /* TAB 1: SORT_BY */
            <div className="space-y-4 text-xs">
              {/* 1. Alphabetically */}
              <div className="space-y-1.5">
                <span className="text-gray-700 font-semibold block">Alphabetically</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'A - Z', order: 'asc' },
                    { label: 'Z - A', order: 'desc' },
                  ].map((opt) => {
                    const isSelected = selectedSort.field === 'alphabetical' && selectedSort.order === opt.order;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleSortSelect('alphabetical', opt.order)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#603DC8]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. LTP */}
              <div className="space-y-1.5">
                <span className="text-gray-700 font-semibold block">LTP (Last Traded Price)</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'High - Low', order: 'desc' },
                    { label: 'Low - High', order: 'asc' },
                  ].map((opt) => {
                    const isSelected = selectedSort.field === 'ltp' && selectedSort.order === opt.order;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleSortSelect('ltp', opt.order)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#603DC8]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Unrealized PnL */}
              <div className="space-y-1.5">
                <span className="text-gray-700 font-semibold block">Unrealized PnL</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'High - Low', order: 'desc' },
                    { label: 'Low - High', order: 'asc' },
                  ].map((opt) => {
                    const isSelected = selectedSort.field === 'pnl' && selectedSort.order === opt.order;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleSortSelect('pnl', opt.order)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#603DC8]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. LTP Change (%) */}
              <div className="space-y-1.5">
                <span className="text-gray-700 font-semibold block">LTP Change %</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'High - Low', order: 'desc' },
                    { label: 'Low - High', order: 'asc' },
                  ].map((opt) => {
                    const isSelected = selectedSort.field === 'change' && selectedSort.order === opt.order;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleSortSelect('change', opt.order)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#603DC8]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. ATP (Average Traded Price) */}
              <div className="space-y-1.5">
                <span className="text-gray-700 font-semibold block">ATP (Average Traded Price)</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'High - Low', order: 'desc' },
                    { label: 'Low - High', order: 'asc' },
                  ].map((opt) => {
                    const isSelected = selectedSort.field === 'atp' && selectedSort.order === opt.order;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleSortSelect('atp', opt.order)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#603DC8]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Invested Amount */}
              <div className="space-y-1.5">
                <span className="text-gray-700 font-semibold block">Invested Amount</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'High - Low', order: 'desc' },
                    { label: 'Low - High', order: 'asc' },
                  ].map((opt) => {
                    const isSelected = selectedSort.field === 'invested' && selectedSort.order === opt.order;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleSortSelect('invested', opt.order)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#603DC8]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: FILTER */
            <div className="space-y-4 text-xs">
              {/* 1. Exchange */}
              <div className="space-y-1.5">
                <span className="text-gray-700 font-semibold block">Exchange</span>
                <div className="flex items-center gap-2">
                  {['NSE', 'BSE'].map((ex) => {
                    const isChecked = (selectedFilters.exchange || []).includes(ex);
                    return (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => handleFilterToggle('exchange', ex)}
                        className={`py-1.5 px-4 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                          isChecked
                            ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{ex}</span>
                        {isChecked && <Check className="w-3 h-3 text-[#603DC8]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Segment */}
              <div className="space-y-1.5">
                <span className="text-gray-700 font-semibold block">Segment</span>
                <div className="flex flex-wrap gap-2">
                  {['Equity', 'F&O', 'Commodity'].map((seg) => {
                    const isChecked = (selectedFilters.segment || []).includes(seg);
                    return (
                      <button
                        key={seg}
                        type="button"
                        onClick={() => handleFilterToggle('segment', seg)}
                        className={`py-1.5 px-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                          isChecked
                            ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{seg}</span>
                        {isChecked && <Check className="w-3 h-3 text-[#603DC8]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Market Cap */}
              <div className="space-y-1.5">
                <span className="text-gray-700 font-semibold block">Market Cap</span>
                <div className="flex flex-wrap gap-2">
                  {['Large Cap', 'Mid Cap', 'Small Cap'].map((mc) => {
                    const isChecked = (selectedFilters.marketCap || []).includes(mc);
                    return (
                      <button
                        key={mc}
                        type="button"
                        onClick={() => handleFilterToggle('marketCap', mc)}
                        className={`py-1.5 px-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                          isChecked
                            ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{mc}</span>
                        {isChecked && <Check className="w-3 h-3 text-[#603DC8]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Product Type */}
              <div className="space-y-1.5">
                <span className="text-gray-700 font-semibold block">Product Type</span>
                <div className="flex flex-wrap gap-2">
                  {['Delivery', 'Intraday', 'Pay Later (MTF)'].map((pt) => {
                    const isChecked = (selectedFilters.productType || []).includes(pt);
                    return (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => handleFilterToggle('productType', pt)}
                        className={`py-1.5 px-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                          isChecked
                            ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{pt}</span>
                        {isChecked && <Check className="w-3 h-3 text-[#603DC8]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Status / Profit-Loss */}
              <div className="space-y-1.5">
                <span className="text-gray-700 font-semibold block">Status</span>
                <div className="flex flex-wrap gap-2">
                  {context === 'orders'
                    ? ['OPEN', 'EXECUTED', 'CANCELLED', 'REJECTED'].map((st) => {
                        const isChecked = (selectedFilters.status || []).includes(st);
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleFilterToggle('status', st)}
                            className={`py-1.5 px-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                              isChecked
                                ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{st}</span>
                            {isChecked && <Check className="w-3 h-3 text-[#603DC8]" />}
                          </button>
                        );
                      })
                    : ['Profit', 'Loss'].map((st) => {
                        const isChecked = (selectedFilters.status || []).includes(st);
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleFilterToggle('status', st)}
                            className={`py-1.5 px-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                              isChecked
                                ? 'bg-purple-50 border-[#603DC8] text-[#603DC8] font-bold'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{st}</span>
                            {isChecked && <Check className="w-3 h-3 text-[#603DC8]" />}
                          </button>
                        );
                      })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Bottom CTA Bar */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex items-center justify-between gap-3 shadow-xs">
          <button
            type="button"
            onClick={handleResetInternal}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer text-center"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#603DC8] hover:bg-[#502EB8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;

