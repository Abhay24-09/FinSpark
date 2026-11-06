import { useState, useMemo } from 'react';
import { ArrowLeft, Bookmark } from 'lucide-react';
import Tabs from '../common/Tabs';
import IndexDropdown from '../common/Dropdown';
import CompanyLogo from '../common/CompanyLogo';
import { MARKET_MOVERS_TABLE_DATA, INDEX_OPTIONS } from '../../data/marketData';

const SUB_TABS = [
  { id: 'top_gainers', label: 'Top Gainers' },
  { id: 'top_losers', label: 'Top Losers' },
  { id: 'high_returns', label: 'High Returns' },
  { id: 'by_volume', label: 'By Volume' },
  { id: 'by_value', label: 'By Value' },
];

export const MarketMoversDetail = ({ onBack, searchQuery = '', onSelectStock }) => {
  const [selectedIndex, setSelectedIndex] = useState('nifty_50');
  const [activeSubTab, setActiveSubTab] = useState('top_gainers');
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  const toggleBookmark = (id) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter table data based on activeSubTab and searchQuery
  const filteredData = useMemo(() => {
    return MARKET_MOVERS_TABLE_DATA.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.symbol.toLowerCase().includes(q) ||
          item.exchange.toLowerCase().includes(q)
        );
      }
      return item.category?.includes(activeSubTab);
    });
  }, [activeSubTab, searchQuery]);

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4 space-y-3">
      {/* Top Header: Back Arrow, Title, Index Dropdown */}
      <div className="flex items-center justify-between pb-2 border-b border-card-border">
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
            Market Movers
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <IndexDropdown
            options={INDEX_OPTIONS}
            selectedId={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </div>
      </div>

      {/* Subtabs Filter */}
      <div className="pt-0.5 pb-0.5">
        <Tabs
          tabs={SUB_TABS}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          size="sm"
        />
      </div>

      {/* Full Details Data Table */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-card-border text-text-muted text-[11px] font-semibold tracking-wider uppercase">
              <th className="py-3 px-3">Name</th>
              <th className="py-3 px-3">Symbol</th>
              <th className="py-3 px-3">Volume</th>
              <th className="py-3 px-3">LTP</th>
              <th className="py-3 px-3">Change</th>
              <th className="py-3 px-3">% Change</th>
              <th className="py-3 px-3">Open</th>
              <th className="py-3 px-3">Prev-Close</th>
              <th className="py-3 px-3 text-right">Watchlist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {filteredData.map((row) => {
              const isBookmarked = bookmarkedIds.has(row.id);
              const isRowHighlighted = row.isHighlighted;

              // Check if stock is below today's opening price (if below open -> red, otherwise green)
              const ltp = typeof row.ltpRaw === 'number'
                ? row.ltpRaw
                : parseFloat(String(row.ltp || '').replace(/[^0-9.-]/g, ''));
              const open = typeof row.openRaw === 'number'
                ? row.openRaw
                : parseFloat(String(row.open || '').replace(/[^0-9.-]/g, ''));

              const isPositive = (!isNaN(ltp) && !isNaN(open) && open > 0)
                ? ltp >= open
                : (row.isPositive !== undefined ? row.isPositive : true);

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectStock && onSelectStock(row)}
                  className={`transition-colors hover:bg-gray-50/80 cursor-pointer ${
                    isRowHighlighted ? 'bg-[#FFF9F5]' : ''
                  }`}
                >
                  {/* Name with Logo */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-3">
                      <CompanyLogo name={row.id} size={32} />
                      <div>
                        <div className="font-bold text-text-main text-xs sm:text-sm">
                          {row.name}
                        </div>
                        <span className="text-[10px] text-text-light font-medium">
                          {row.exchange}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Symbol */}
                  <td className="py-2 px-3 font-semibold text-text-main text-[11px] sm:text-xs">
                    {row.symbol}
                  </td>

                  {/* Volume */}
                  <td className="py-2 px-3 text-text-muted text-[11px] sm:text-xs">
                    {row.volume}
                  </td>

                  {/* LTP */}
                  <td className="py-2 px-3 font-bold text-text-main text-[11px] sm:text-xs">
                    {row.ltp}
                  </td>

                  {/* Change */}
                  <td
                    className={`py-2 px-3 font-semibold text-[11px] sm:text-xs ${
                      isPositive ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {row.change}
                  </td>

                  {/* % Change */}
                  <td
                    className={`py-2 px-3 font-semibold text-[11px] sm:text-xs ${
                      isPositive ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {row.changePercent}
                  </td>

                  {/* Open */}
                  <td className="py-2 px-3 text-text-muted text-[11px] sm:text-xs">
                    {row.open}
                  </td>

                  {/* Prev-Close */}
                  <td className="py-2 px-3 text-text-muted text-[11px] sm:text-xs">
                    {row.prevClose}
                  </td>

                  {/* Watchlist Bookmark */}
                  <td className="py-2 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(row.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-accent cursor-pointer"
                      title={isBookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      <Bookmark
                        className={`w-4 h-4 text-accent transition-all ${
                          isBookmarked ? 'fill-accent' : ''
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredData.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-text-muted text-xs">
                  No stocks found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketMoversDetail;

