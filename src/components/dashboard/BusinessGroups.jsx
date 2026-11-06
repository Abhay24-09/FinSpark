import SectionHeader from '../common/SectionHeader';
import CompanyLogo from '../common/CompanyLogo';
import { BUSINESS_GROUPS } from '../../data/marketData';

export const BusinessGroups = ({ onSelectGroup, onViewAll }) => {
  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      <SectionHeader title="Top Business Groups" onViewAll={onViewAll} />

      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-1">
        {BUSINESS_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelectGroup?.(group)}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none transition-transform hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 rounded-full border border-card-border shadow-xs p-1 flex items-center justify-center group-hover:border-primary/50 transition-colors bg-card-bg">
              <CompanyLogo name={group.logoKey} size={40} />
            </div>
            <span className="text-[11px] font-medium text-text-main group-hover:text-primary transition-colors truncate max-w-[64px] text-center">
              {group.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BusinessGroups;
