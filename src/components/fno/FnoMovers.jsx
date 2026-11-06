import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import ContractRow from './ContractRow';
import { FNO_MOVERS_TABS, FNO_MOVERS_CONTRACTS } from '../../data/fnoData';

export const FnoMovers = () => {
  const [activeTab, setActiveTab] = useState('top_gainers');

  const firstBatch = FNO_MOVERS_CONTRACTS.slice(0, 5);
  const secondBatch = FNO_MOVERS_CONTRACTS.slice(5);

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      {/* Title & View all */}
      <SectionHeader
        title="FnO Movers"
        onViewAll={() => console.log('View all FnO Movers')}
      />

      {/* Sub-tabs with purple active indicator */}
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-0.5 pb-2">
        {FNO_MOVERS_TABS.map((tab) => {
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

      {/* First 5 Contract Rows */}
      <div className="divide-y divide-gray-100">
        {firstBatch.map((contract) => (
          <ContractRow key={contract.id} contract={contract} />
        ))}
      </div>

      {/* Alert Banner Callout */}
      <div className="my-2 p-2.5 bg-warning-bg border border-warning-border rounded-lg flex items-center gap-2 text-warning-text text-xs">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
        <span className="font-medium text-[11px] sm:text-xs">
          Alert message will go here to draw user attention
        </span>
      </div>

      {/* Remaining Contract Rows */}
      <div className="divide-y divide-gray-100">
        {secondBatch.map((contract) => (
          <ContractRow key={contract.id} contract={contract} />
        ))}
      </div>
    </div>
  );
};

export default FnoMovers;

