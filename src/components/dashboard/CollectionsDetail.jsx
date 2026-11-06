import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Wallet,
  BatteryCharging,
  TrendingUp,
  Percent,
  Zap,
} from 'lucide-react';
import DetailStocksTable from '../common/DetailStocksTable';
import ExchangeToggle from '../common/ExchangeToggle';
import {
  COLLECTIONS_DETAIL_ITEMS,
  COLLECTIONS_STOCKS,
} from '../../data/collectionsData';

const ICON_MAP = {
  wallet: Wallet,
  battery: BatteryCharging,
  arrow_up: TrendingUp,
  coins: Percent,
  zap: Zap,
};

export const CollectionsDetail = ({ onBack, searchQuery = '', onSelectStock }) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState('under_250');
  const [activeExchange, setActiveExchange] = useState('NSE');
  const [expandedId, setExpandedId] = useState(null);

  const displayedStocks = useMemo(() => {
    return COLLECTIONS_STOCKS.filter((stock) => {
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
      {/* Top Header: Back Arrow, Title, Exchange Toggle */}
      <div className="px-4 sm:px-5 py-3 border-b border-card-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-gray-100 transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-text-main tracking-tight">
            Collections for You
          </h1>
        </div>

        {/* Single Exchange Toggle Button (NSE ⇄ BSE) matching user design */}
        <ExchangeToggle
          currentExchange={activeExchange}
          onToggle={setActiveExchange}
        />
      </div>

      {/* Main Two-Column View */}
      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Left Column: Collections List */}
        <aside className="w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-card-border p-3 sm:p-4 space-y-2 overflow-y-auto max-h-[750px] no-scrollbar">
          {COLLECTIONS_DETAIL_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.iconKey] || Wallet;
            const isActive = selectedCollectionId === item.id;
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedCollectionId(item.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 select-none ${
                  isActive
                    ? 'bg-primary-light shadow-2xs'
                    : 'hover:bg-gray-50/80 text-text-main'
                }`}
              >
                {/* Collection Icon */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white text-primary shadow-2xs'
                      : 'bg-gray-100 text-primary/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-bold leading-tight ${
                        isActive ? 'text-primary' : 'text-text-main'
                      }`}
                    >
                      {item.title}
                    </span>

                    {/* Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        item.isHot
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-text-muted'
                      }`}
                    >
                      {item.isHot ? `🔥 ${item.badge}` : item.badge}
                    </span>
                  </div>

                  <p
                    className={`text-[11px] text-text-muted leading-snug mt-1 ${
                      isExpanded ? '' : 'line-clamp-2'
                    }`}
                  >
                    {item.description}
                  </p>

                  {/* Show More toggle if under 250 */}
                  {item.id === 'under_250' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : item.id);
                      }}
                      className="text-[11px] font-semibold text-accent hover:underline mt-0.5 inline-block cursor-pointer"
                    >
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                  )}
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

export default CollectionsDetail;

