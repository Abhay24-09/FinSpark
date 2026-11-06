import SectionHeader from '../common/SectionHeader';
import { SECTOR_CHIPS } from '../../data/marketData';

export const StocksBySectors = ({ onSelectSector, onViewAll }) => {
  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      <SectionHeader
        title="Stocks by Sectors"
        onViewAll={onViewAll}
      />

      <div className="flex flex-wrap gap-1.5 mt-1">
        {SECTOR_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectSector?.(chip)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D1FADF] text-[#027A48] hover:bg-[#A6F4C5] active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StocksBySectors;

