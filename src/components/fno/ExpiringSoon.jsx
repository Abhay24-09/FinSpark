import { useState } from 'react';
import SectionHeader from '../common/SectionHeader';
import ContractRow from './ContractRow';
import { EXPIRING_SOON_CONTRACTS } from '../../data/fnoData';

const TABS = [
  { id: 'futures', label: 'Futures' },
  { id: 'options', label: 'Options' },
];

export const ExpiringSoon = () => {
  const [activeTab, setActiveTab] = useState('futures');

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      {/* Title & View all */}
      <SectionHeader
        title="Expiring Soon"
        onViewAll={() => console.log('View all Expiring Soon')}
      />

      {/* Tabs: Futures | Options */}
      <div className="flex items-center gap-6 border-b border-card-border overflow-x-auto no-scrollbar pt-1 pb-1">
        {TABS.map((tab) => {
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

      {/* Contracts List */}
      <div className="divide-y divide-gray-100 pt-1">
        {EXPIRING_SOON_CONTRACTS.map((contract) => (
          <ContractRow key={contract.id} contract={contract} />
        ))}
      </div>
    </div>
  );
};

export default ExpiringSoon;

