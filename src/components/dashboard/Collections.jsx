import { Wallet, Zap, Trophy, Percent, Leaf } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import { COLLECTIONS } from '../../data/marketData';

const iconMap = {
  wallet: Wallet,
  zap: Zap,
  trophy: Trophy,
  percent: Percent,
  leaf: Leaf,
};

export const Collections = ({ onSelectCollection, onViewAll }) => {
  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      <SectionHeader
        title="Collections for You"
        onViewAll={onViewAll}
      />

      <div className="divide-y divide-gray-50 mt-0.5">
        {COLLECTIONS.map((col, idx) => {
          const IconComponent = iconMap[col.iconKey] || Zap;

          return (
            <div
              key={`${col.id}-${idx}`}
              onClick={() => onSelectCollection?.(col)}
              className="py-2 px-1 flex items-start gap-3 hover:bg-gray-50/70 rounded-lg transition-colors cursor-pointer group"
            >
              {/* Theme Primary Circle Icon */}
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 group-hover:scale-105 transition-transform">
                <IconComponent className="w-4 h-4" />
              </div>

              {/* Title and Description */}
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
                  {col.title}
                </h3>
                <p className="text-[11px] text-text-muted leading-snug mt-0.5 line-clamp-2">
                  {col.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Collections;
