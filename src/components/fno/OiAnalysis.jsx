import { useState } from 'react';
import SectionHeader from '../common/SectionHeader';
import { FNO_INDICES_TABS, OI_ANALYSIS_BARS } from '../../data/fnoData';

const SUB_FILTERS = [
  { id: 'atm_straddle', label: 'ATM Straddle' },
  { id: 'oi', label: 'OI' },
  { id: 'change_oi', label: 'Change OI' },
  { id: 'pcr', label: 'PCR' },
];

export const OiAnalysis = () => {
  const [selectedIndex, setSelectedIndex] = useState('nifty_50');
  const [selectedFilter, setSelectedFilter] = useState('oi');

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4">
      {/* Header: Title + Detailed View */}
      <SectionHeader
        title="OI Analysis"
        onViewAll={() => console.log('Detailed View OI Analysis')}
        viewAllLink="Detailed View"
      />

      {/* Index Tabs with Purple Underline */}
      <div className="flex items-center gap-5 border-b border-card-border overflow-x-auto no-scrollbar pb-0.5">
        {FNO_INDICES_TABS.map((tab) => {
          const isActive = selectedIndex === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedIndex(tab.id)}
              className={`relative pb-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
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

      {/* Sub-filters (ATM Straddle, OI, Change OI, PCR) */}
      <div className="flex items-center gap-2 pt-2 pb-2.5 overflow-x-auto no-scrollbar">
        {SUB_FILTERS.map((filter) => {
          const isActive = selectedFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-primary-light text-primary font-semibold'
                  : 'bg-gray-100 text-text-muted hover:text-text-main hover:bg-gray-200/70'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Visual Bar Chart */}
      <div className="relative pt-2 pb-1">
        {/* Chart area with Y-axis guidelines */}
        <div className="relative h-36 flex items-end">
          {/* Y-axis Labels on Left */}
          <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-[10px] text-text-light font-medium pointer-events-none pb-5">
            <span>2 Cr</span>
            <span>1.5 Cr</span>
            <span>0.5 Cr</span>
            <span>0</span>
          </div>

          {/* Bars Container */}
          <div className="w-full ml-10 flex items-end justify-between gap-2 h-full pb-5 border-b border-gray-100">
            {OI_ANALYSIS_BARS.map((bar) => (
              <div
                key={bar.strike}
                className="flex-1 flex flex-col items-center justify-end h-full group"
              >
                {/* Paired Bars (Green: Call, Red: Put) */}
                <div className="flex items-end justify-center gap-1 w-full h-[85%]">
                  {/* Call OI Bar */}
                  <div
                    style={{ height: `${bar.callOI}%` }}
                    className="w-2.5 sm:w-3.5 bg-emerald-400 rounded-t-sm transition-all group-hover:opacity-85"
                    title={`Call OI: ${bar.callOI}%`}
                  />
                  {/* Put OI Bar */}
                  <div
                    style={{ height: `${bar.putOI}%` }}
                    className="w-2.5 sm:w-3.5 bg-rose-500 rounded-t-sm transition-all group-hover:opacity-85"
                    title={`Put OI: ${bar.putOI}%`}
                  />
                </div>
                {/* Strike Label */}
                <span className="text-[10px] font-medium text-text-muted mt-2 whitespace-nowrap">
                  {bar.strike}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend & Expiry Footer */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-semibold rounded shadow-xs">
              Call OI
            </span>
            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-semibold rounded shadow-xs">
              Put OI
            </span>
          </div>
          <span className="text-xs text-text-muted font-medium">
            Exp: 09 Sep 25
          </span>
        </div>
      </div>
    </div>
  );
};

export default OiAnalysis;

