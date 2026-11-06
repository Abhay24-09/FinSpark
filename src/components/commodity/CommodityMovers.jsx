import { useState } from 'react';
import SectionHeader from '../common/SectionHeader';
import ContractRow from '../fno/ContractRow';
import { COMMODITY_MOVERS_TABS, COMMODITY_MOVERS_CONTRACTS } from '../../data/commodityData';

export const CommodityMovers = () => {
  const [activeTab, setActiveTab] = useState('top_gainers');

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      {/* Title & View all */}
      <SectionHeader
        title="Commodity Movers"
        onViewAll={() => console.log('View all Commodity Movers')}
      />

      {/* Sub-tabs with Purple Underline Indicator */}
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-0.5 pb-2">
        {COMMODITY_MOVERS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-2 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Contract Items List */}
      <div className="divide-y divide-gray-100">
        {COMMODITY_MOVERS_CONTRACTS.map((contract) => (
          <ContractRow key={contract.id} contract={contract} />
        ))}
      </div>
    </div>
  );
};

export default CommodityMovers;

