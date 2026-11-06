import SectionHeader from '../common/SectionHeader';
import { FNO_EXPERTS_PICKS } from '../../data/fnoData';

export const FnoExpertsPick = () => {
  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      <SectionHeader
        title="Expert's Pick"
        onViewAll={() => console.log('View all expert picks')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-0.5">
        {FNO_EXPERTS_PICKS.map((item) => (
          <div
            key={item.id}
            className="p-3 border border-card-border rounded-xl flex flex-col justify-between gap-2.5 bg-card-bg hover:border-primary/40 transition-all shadow-xs"
          >
            {/* Top row: Name & Expiry vs Price & Change */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-text-main">
                  {item.name}
                </h4>
                <span className="text-[10px] text-text-light font-medium">
                  {item.expiry}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-sm font-bold text-text-main">
                  {item.price}
                </div>
                <div
                  className={`text-[10px] font-semibold ${
                    item.isPositive ? 'text-success' : 'text-danger'
                  }`}
                >
                  {item.change}
                </div>
              </div>
            </div>

            {/* 3 Stats Columns */}
            <div className="grid grid-cols-3 gap-1 py-1.5 border-t border-b border-gray-100 text-[11px]">
              <div>
                <div className="text-text-light text-[10px]">{item.field1Label}</div>
                <div className="font-semibold text-text-main">{item.field1Val}</div>
              </div>
              <div className="text-center">
                <div className="text-text-light text-[10px]">{item.field2Label}</div>
                <div className="font-semibold text-text-main">{item.field2Val}</div>
              </div>
              <div className="text-right">
                <div className="text-text-light text-[10px]">{item.field3Label}</div>
                <div className="font-semibold text-text-main">{item.field3Val}</div>
              </div>
            </div>

            {/* Action Button: BUY (Green) or SELL (Red) */}
            <button
              type="button"
              className={`w-full py-2 text-white font-bold text-xs rounded-lg hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-xs tracking-wider ${
                item.actionType === 'buy' ? 'bg-success' : 'bg-danger'
              }`}
            >
              {item.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FnoExpertsPick;

