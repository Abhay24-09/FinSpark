import SectionHeader from '../common/SectionHeader';
import { EXPERTS_PICKS } from '../../data/marketData';

export const ExpertsPick = ({ onSelectStock }) => {
  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      <SectionHeader
        title="Expert's Pick"
        onViewAll={() => console.log('View all expert picks')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-0.5">
        {EXPERTS_PICKS.map((stock) => (
          <div
            key={stock.id}
            role="button"
            tabIndex={0}
            title={`View ${stock.name} Details`}
            onClick={() => onSelectStock && onSelectStock(stock)}
            className="p-3 border border-card-border rounded-xl flex flex-col justify-between gap-2.5 bg-card-bg hover:border-primary/50 hover:bg-gray-50/50 transition-all shadow-xs cursor-pointer select-none"
          >
            {/* Top row: Name & exchange vs Price & change */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                  {stock.name}
                </h4>
                <span className="text-[10px] text-text-light font-medium">
                  {stock.exchange}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-sm font-bold text-text-main">
                  {stock.price}
                </div>
                <div
                  className={`text-[10px] font-semibold ${
                    stock.isPositive ? 'text-success' : 'text-danger'
                  }`}
                >
                  {stock.change} ({stock.changePercent})
                </div>
              </div>
            </div>

            {/* Target & Price stats */}
            <div className="grid grid-cols-3 gap-1 py-1 border-t border-b border-gray-100 text-[11px]">
              <div>
                <div className="text-text-light text-[10px]">Enter At</div>
                <div className="font-semibold text-text-main">{stock.enterAt}</div>
              </div>
              <div className="text-center">
                <div className="text-text-light text-[10px]">Stop-Loss</div>
                <div className="font-semibold text-text-main">{stock.stopLoss}</div>
              </div>
              <div className="text-right">
                <div className="text-text-light text-[10px]">Max. Profit</div>
                <div className="font-semibold text-text-main">{stock.maxProfit}</div>
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectStock) onSelectStock(stock);
              }}
              className="w-full py-2 bg-success text-white font-bold text-xs rounded-lg hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-xs tracking-wider"
            >
              {stock.action || 'BUY'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpertsPick;
