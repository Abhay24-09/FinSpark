import { COMMODITY_MARKET_TODAY } from '../../data/commodityData';

export const MarketTodayCards = () => {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-bold text-text-main mb-1.5 tracking-tight">
        Market Today
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
        {COMMODITY_MARKET_TODAY.map((item) => (
          <div
            key={item.id}
            className="bg-card-bg rounded-xl border border-card-border p-2.5 shadow-xs hover:border-primary/30 transition-all cursor-pointer"
          >
            <div className="text-xs font-semibold text-text-main truncate">
              {item.name}
            </div>
            <div className="flex items-baseline gap-1 mt-1 flex-wrap">
              <span className="text-xs font-bold text-text-main">{item.price}</span>
              <span className="text-[10px] font-semibold text-danger">
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketTodayCards;

