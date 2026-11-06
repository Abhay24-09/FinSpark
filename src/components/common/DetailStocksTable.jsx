import CompanyLogo from './CompanyLogo';

/**
 * Unified, reusable stocks table used across all detail views
 * (Stocks by Sector, Collections for You, Top Business Group, etc.)
 */
export const DetailStocksTable = ({
  stocks = [],
  className = '',
  emptyMessage = 'No stocks found matching the criteria.',
  onSelectStock,
}) => {
  // Determine if stock is below today's opening price (if below open -> red, otherwise green)
  const isStockPositive = (stock) => {
    const ltp = typeof stock.lastTradedPrice === 'number'
      ? stock.lastTradedPrice
      : (typeof stock.ltpRaw === 'number'
        ? stock.ltpRaw
        : parseFloat(String(stock.ltp || stock.price || '').replace(/[^0-9.-]/g, '')));

    const open = typeof stock.open === 'number'
      ? stock.open
      : (typeof stock.openRaw === 'number'
        ? stock.openRaw
        : parseFloat(String(stock.open || stock.openPrice || '').replace(/[^0-9.-]/g, '')));

    if (!isNaN(ltp) && !isNaN(open) && open > 0) {
      return ltp >= open;
    }
    return stock.isPositive !== undefined ? stock.isPositive : true;
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-left text-xs min-w-[680px]">
        <thead>
          <tr className="border-b border-gray-100 text-[11px] text-text-light font-semibold uppercase tracking-wider select-none">
            <th className="py-2.5 px-3">Name</th>
            <th className="py-2.5 px-3">Symbol</th>
            <th className="py-2.5 px-3">Volume</th>
            <th className="py-2.5 px-3">LTP</th>
            <th className="py-2.5 px-3">Change</th>
            <th className="py-2.5 px-3">% Change</th>
            <th className="py-2.5 px-3">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {stocks.map((stock) => {
            const isPositive = isStockPositive(stock);

            return (
              <tr
                key={stock.id || stock.symbol}
                onClick={() => onSelectStock && onSelectStock(stock)}
                className="hover:bg-gray-50/60 transition-colors cursor-pointer group select-none"
              >
                {/* Name & Logo */}
                <td className="py-2 px-3">
                  <div className="flex items-center gap-3">
                    <CompanyLogo size={28} />
                    <div>
                      <div className="font-semibold text-text-main group-hover:text-primary transition-colors">
                        {stock.name}
                      </div>
                      <div className="text-[10px] text-text-light font-medium uppercase">
                        {stock.exchange || 'NSE'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Symbol */}
                <td className="py-2 px-3 font-semibold text-text-muted tracking-wide text-xs">
                  {stock.symbol}
                </td>

                {/* Volume */}
                <td className="py-2 px-3 font-medium text-text-main text-xs">
                  {stock.volume}
                </td>

                {/* LTP */}
                <td className="py-2 px-3 font-medium text-text-main text-xs whitespace-nowrap">
                  {stock.ltp}
                </td>

                {/* Change */}
                <td
                  className={`py-2 px-3 font-medium text-xs whitespace-nowrap ${
                    isPositive ? 'text-success' : 'text-danger'
                  }`}
                >
                  {stock.change}
                </td>

                {/* % Change */}
                <td
                  className={`py-2 px-3 font-medium text-xs whitespace-nowrap ${
                    isPositive ? 'text-success' : 'text-danger'
                  }`}
                >
                  {stock.changePercent}
                </td>

                {/* Open */}
                <td className="py-2 px-3 font-medium text-text-main text-xs whitespace-nowrap">
                  {stock.open}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {stocks.length === 0 && (
        <div className="p-8 text-center text-text-muted text-xs">
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

export default DetailStocksTable;

