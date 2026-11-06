import { useState, useMemo, Fragment } from 'react';
import { AlertTriangle } from 'lucide-react';
import Tabs from '../common/Tabs';
import IndexDropdown from '../common/Dropdown';
import CompanyLogo from '../common/CompanyLogo';
import Badge from '../common/Badge';
import { STOCK_DATA, INDEX_OPTIONS } from '../../data/marketData';

const SUB_TABS = [
  { id: 'top_gainers', label: 'Top Gainers' },
  { id: 'top_losers', label: 'Top Losers' },
  { id: 'high_returns', label: 'High Returns' },
  { id: 'by_volume', label: 'By Volume' },
  { id: 'by_value', label: 'By Value' },
];

export const MarketMovers = ({ searchQuery = '', onViewAll, onSelectStock }) => {
  const [selectedIndex, setSelectedIndex] = useState('nifty_50');
  const [activeSubTab, setActiveSubTab] = useState('top_gainers');

  // Filter stocks according to active index, subtab, and search query
  const filteredStocks = useMemo(() => {
    return STOCK_DATA.filter((stock) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          stock.name.toLowerCase().includes(query) ||
          stock.exchange.toLowerCase().includes(query) ||
          stock.price.includes(query)
        );
      }
      // Subtab category filter
      return stock.category?.includes(activeSubTab);
    });
  }, [activeSubTab, searchQuery]);

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      {/* Header with Title, Index Dropdown and View all */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-card-border">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-text-main">Market Movers</h2>
          <IndexDropdown
            options={INDEX_OPTIONS}
            selectedId={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-accent hover:underline cursor-pointer"
        >
          View all
        </button>
      </div>

      {/* Filter Sub-tabs */}
      <div className="pt-2 pb-0.5">
        <Tabs
          tabs={SUB_TABS}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          size="sm"
        />
      </div>

      {/* Stock List with Alert Banner */}
      <div className="divide-y divide-gray-50 mt-0.5">
        {filteredStocks.map((stock, index) => {
          // If the stock is below today's opening price, show in red, otherwise green
          const ltp = typeof stock.lastTradedPrice === 'number'
            ? stock.lastTradedPrice
            : parseFloat(String(stock.price || '').replace(/[^0-9.-]/g, ''));
          const open = typeof stock.open === 'number'
            ? stock.open
            : parseFloat(String(stock.open || stock.openFormatted || '').replace(/[^0-9.-]/g, ''));
          const isPositive = (!isNaN(ltp) && !isNaN(open) && open > 0)
            ? ltp >= open
            : (stock.isPositive !== undefined ? stock.isPositive : true);

          return (
            <Fragment key={stock.id}>
              {/* Alert message injected at position 5 (between Vodafone Idea and Bharti Airtel) */}
              {index === 5 && !searchQuery && (
                <div className="my-2 py-2 px-3 bg-warning-bg border border-warning-border rounded-lg flex items-center gap-2 text-xs text-warning-text">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                  <span className="font-medium">
                    Alert message will go here to draw user attention
                  </span>
                </div>
              )}

              <div
                role="button"
                tabIndex={0}
                title={`View ${stock.name} Details`}
                onClick={() => onSelectStock && onSelectStock(stock)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectStock && onSelectStock(stock);
                  }
                }}
                className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-primary/5 active:bg-primary/10 rounded-lg transition-colors cursor-pointer group select-none"
              >
                {/* Stock Logo and Name info */}
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyLogo name={stock.logo || stock.name} size={36} />
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-text-main group-hover:text-primary transition-colors truncate">
                      {stock.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-medium text-text-light">
                        {stock.exchange}
                      </span>
                      {stock.badge && (
                        <Badge variant="purple" className="text-[9px] py-0 px-1">
                          {stock.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Price and Change */}
                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-text-main">
                    {stock.price}
                  </div>
                  <div
                    className={`text-[11px] font-medium tracking-tight ${
                      isPositive ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {stock.change} ({stock.changePercent})
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}

        {filteredStocks.length === 0 && (
          <div className="py-8 text-center text-xs text-text-muted font-medium">
            No stocks found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketMovers;
