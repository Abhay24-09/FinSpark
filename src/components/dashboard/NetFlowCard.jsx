import Badge from '../common/Badge';
import { NET_FLOW_DATA } from '../../data/marketData';

export const NetFlowCard = () => {
  const { title, date, duration, exchange, fii, dii } = NET_FLOW_DATA;

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs overflow-hidden">
      {/* Theme Primary Light Header Bar */}
      <div className="bg-primary-light px-3.5 py-2 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-bold text-primary tracking-tight">
          {title}
        </h3>
        <button
          type="button"
          className="text-xs font-semibold text-accent hover:underline cursor-pointer"
        >
          View all
        </button>
      </div>

      {/* Content Area */}
      <div className="p-3 sm:p-3.5">
        {/* Date and Exchange indicator */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-text-main">
            {date} • {duration}
          </span>
          <Badge variant="purple" className="text-[9px] py-0 px-1.5 font-bold">
            {exchange}
          </Badge>
        </div>

        {/* FII and DII Stats */}
        <div className="grid grid-cols-2 gap-3 pt-0.5">
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
              {fii.label}:
            </div>
            <div className="text-xs sm:text-sm font-bold text-success">
              {fii.amount}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
              {dii.label}:
            </div>
            <div className="text-xs sm:text-sm font-bold text-success">
              {dii.amount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetFlowCard;
