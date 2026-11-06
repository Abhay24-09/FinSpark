import { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import CompanyLogo from '../common/CompanyLogo';
import DetailStocksTable from '../common/DetailStocksTable';
import {
  BUSINESS_GROUPS_DETAIL_ITEMS,
  BUSINESS_GROUPS_STOCKS,
} from '../../data/businessGroupsData';

export const BusinessGroupDetail = ({ onBack, searchQuery = '', onSelectStock }) => {
  const [selectedGroupId, setSelectedGroupId] = useState('tata');

  const displayedStocks = useMemo(() => {
    return BUSINESS_GROUPS_STOCKS.filter((stock) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          stock.name.toLowerCase().includes(q) ||
          stock.symbol.toLowerCase().includes(q) ||
          stock.exchange.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery]);

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs overflow-hidden">
      {/* Top Header: Back Arrow + Title */}
      <div className="px-4 sm:px-5 py-3 border-b border-card-border flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-gray-100 transition-colors cursor-pointer"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-text-main tracking-tight">
          Top Business Group
        </h1>
      </div>

      {/* Main Two-Column View */}
      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Left Column: Business Groups List */}
        <aside className="w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-card-border p-3 sm:p-4 space-y-2 overflow-y-auto max-h-[750px] no-scrollbar">
          {BUSINESS_GROUPS_DETAIL_ITEMS.map((group) => {
            const isActive = selectedGroupId === group.id;

            return (
              <div
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 select-none ${
                  isActive
                    ? 'bg-primary-light shadow-2xs'
                    : 'hover:bg-gray-50/80 text-text-main'
                }`}
              >
                {/* Brand Logo Circle */}
                <div className="w-10 h-10 rounded-full border border-gray-200 bg-white shadow-2xs flex items-center justify-center shrink-0 p-1">
                  <CompanyLogo name={group.name} size={32} />
                </div>

                {/* Group Details */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isActive ? 'text-primary' : 'text-text-main'
                    }`}
                  >
                    {group.name}
                  </div>
                  <p className="text-[11px] text-text-muted leading-snug mt-1 line-clamp-2">
                    {group.description}
                  </p>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Right Column: Stocks Table */}
        <main className="flex-1 min-w-0 p-3 sm:p-5">
          <DetailStocksTable stocks={displayedStocks} onSelectStock={onSelectStock} />
        </main>
      </div>
    </div>
  );
};

export default BusinessGroupDetail;
