import Badge from '../common/Badge';
import { SECTOR_HEATMAP } from '../../data/marketData';

export const SectorHeatmap = () => {
  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-text-main">Sector Heatmap</h2>
          <Badge variant="purple" className="text-[9px] py-0 px-1 font-bold">
            NSE
          </Badge>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-accent hover:underline cursor-pointer"
        >
          View all
        </button>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-6 gap-1 p-1 bg-gray-50 rounded-xl border border-card-border overflow-hidden text-center text-xs">
        {SECTOR_HEATMAP.sectors.map((sector, idx) => (
          <div
            key={idx}
            className={`${sector.colSpan} ${sector.bg} p-2 rounded-lg flex flex-col items-center justify-center min-h-[52px] cursor-pointer hover:opacity-90 transition-opacity`}
          >
            <span className="font-semibold text-[11px] leading-tight truncate w-full px-1">
              {sector.name}
            </span>
            <span className="text-[10px] opacity-90 font-medium">
              {sector.change}
            </span>
          </div>
        ))}
      </div>

      {/* Heatmap Legend */}
      <div className="grid grid-cols-6 gap-1 mt-3 text-center text-[10px] font-semibold text-text-muted">
        {SECTOR_HEATMAP.legend.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <span className={`w-full h-1.5 rounded-full ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectorHeatmap;

