import { TrendingUp, ShieldAlert, Smartphone, BookOpen } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import { KNOWLEDGE_ITEMS } from '../../data/marketData';

const iconMap = {
  1: ShieldAlert,
  2: TrendingUp,
  3: Smartphone,
  4: BookOpen,
};

export const KnowledgeCentre = () => {
  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      <SectionHeader
        title="Knowledge Centre"
        onViewAll={() => console.log('View all articles')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-1">
        {KNOWLEDGE_ITEMS.map((item) => {
          const Icon = iconMap[item.id] || BookOpen;

          return (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden border border-card-border flex flex-col justify-between cursor-pointer group shadow-xs hover:-translate-y-0.5 transition-transform bg-card-bg"
            >
              {/* Illustration Top Banner */}
              <div
                className={`h-20 bg-gradient-to-br ${item.gradient} p-3 flex items-center justify-center relative overflow-hidden`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-xs group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Bottom Dark Title Strip */}
              <div className="bg-[#1D1B26] p-2.5 text-white flex-1 flex items-center">
                <h4 className="text-xs font-bold leading-snug tracking-tight">
                  {item.title}
                </h4>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KnowledgeCentre;

