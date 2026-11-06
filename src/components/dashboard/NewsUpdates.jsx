import { useState } from 'react';
import SectionHeader from '../common/SectionHeader';
import { NEWS_TABS, NEWS_ITEMS } from '../../data/marketData';

export const NewsUpdates = () => {
  const [activeTab, setActiveTab] = useState('market');

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      <SectionHeader
        title="News & Updates"
        onViewAll={() => console.log('View all news')}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 border-b border-card-border">
        {NEWS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary-light text-primary border border-primary/20'
                  : 'text-text-muted hover:text-text-main hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* News Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2">
        {NEWS_ITEMS.map((item) => (
          <div
            key={item.id}
            className="p-3 border border-card-border rounded-xl bg-card-bg hover:border-primary/40 transition-all flex flex-col justify-between cursor-pointer group shadow-2xs"
          >
            <div>
              <span className="text-[10px] font-semibold text-text-light uppercase tracking-wider">
                {item.date}
              </span>
              <h4 className="text-xs font-bold text-text-main group-hover:text-primary transition-colors mt-1.5 leading-snug line-clamp-2">
                {item.title}
              </h4>
              <p className="text-[11px] text-text-muted mt-2 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsUpdates;

