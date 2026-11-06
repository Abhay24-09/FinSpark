import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import ContractRow from './ContractRow';
import { FNO_INDICES_TABS, OI_BUILDUP_CONTRACTS } from '../../data/fnoData';

export const OiBuildup = () => {
  const [sentiment, setSentiment] = useState('bullish');
  const [selectedIndex, setSelectedIndex] = useState('nifty_50');

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      {/* Title & View all */}
      <SectionHeader
        title="OI Buildup"
        onViewAll={() => console.log('View all OI Buildup')}
      />

      {/* Top Filter Row: Bearish / Bullish & Dropdown */}
      <div className="flex items-center justify-between gap-2 pt-0.5 pb-2">
        {/* Sentiment Pills */}
        <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-full border border-gray-100">
          <button
            type="button"
            onClick={() => setSentiment('bearish')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              sentiment === 'bearish'
                ? 'bg-rose-100 text-danger'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Bearish
          </button>
          <button
            type="button"
            onClick={() => setSentiment('bullish')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              sentiment === 'bullish'
                ? 'bg-primary-light text-primary'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Bullish
          </button>
        </div>

        {/* Dropdown: Long Unwinding */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-text-main hover:bg-gray-50 cursor-pointer shadow-2xs"
        >
          <span>Long Unwinding</span>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
        </button>
      </div>

      {/* Index Tabs with Purple Underline */}
      <div className="flex items-center gap-5 border-b border-card-border overflow-x-auto no-scrollbar pb-1">
        {FNO_INDICES_TABS.map((tab) => {
          const isActive = selectedIndex === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedIndex(tab.id)}
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
        {OI_BUILDUP_CONTRACTS.map((contract) => (
          <ContractRow key={contract.id} contract={contract} />
        ))}
      </div>
    </div>
  );
};

export default OiBuildup;

