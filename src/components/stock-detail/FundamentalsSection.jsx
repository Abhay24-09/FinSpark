import React from 'react';

/**
 * FundamentalsSection
 * Conforms 1:1 to the Figma Turbo Web UI Fundamentals screenshot:
 * - Title: Key Stats
 * - Valuation category badge with purple horizontal line
 * - P/E Ratio (Overvalued tag) -> 43.59
 * - P/B Ratio (High tag) -> 2.17
 * - Industry P/E, Market Cap, Debt to Equity, ROE
 */
export const FundamentalsSection = ({ stockData }) => {
  const isBSE = stockData?.exchange === 'BSE';

  const stats = [
    {
      id: 'pe',
      label: 'P/E Ratio',
      tag: { label: 'Overvalued', variant: 'danger' },
      value: isBSE ? '43.48' : '43.59',
    },
    {
      id: 'pb',
      label: 'P/B Ratio',
      tag: { label: 'High', variant: 'neutral' },
      value: isBSE ? '2.16' : '2.17',
    },
    {
      id: 'industry_pe',
      label: 'Industry P/E',
      tag: { label: 'Sector Median', variant: 'blue' },
      value: '26.80',
    },
    {
      id: 'market_cap',
      label: 'Market Cap',
      tag: { label: 'Large Cap', variant: 'success' },
      value: isBSE ? '₹2,02,180 Cr' : '₹2,02,450 Cr',
    },
    {
      id: 'debt_equity',
      label: 'Debt to Equity',
      tag: { label: 'Low Risk', variant: 'success' },
      value: '0.38',
    },
    {
      id: 'roe',
      label: 'ROE',
      tag: { label: 'Good', variant: 'success' },
      value: '14.85%',
    },
  ];

  const getTagStyle = (variant) => {
    switch (variant) {
      case 'danger':
        return 'bg-[#FEE4E2] text-[#D92D20]';
      case 'success':
        return 'bg-[#ECFDF3] text-[#027A48]';
      case 'blue':
        return 'bg-[#EFF8FF] text-[#175CD3]';
      case 'neutral':
      default:
        return 'bg-[#F2F4F7] text-[#344054]';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs p-4 space-y-4">
      {/* Title with Exchange Indicator */}
      <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">Key Stats</h3>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
            isBSE
              ? 'bg-[#FFF4ED] text-[#FF5900] border-[#FFD8C2]'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {isBSE ? 'BSE' : 'NSE'}
          </span>
        </div>
      </div>

      {/* Category Divider: Valuation */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F1ECFE] text-[#603DC8] border border-[#D8CEF8]">
          Valuation
        </span>
        <div className="flex-1 border-t border-[#D8CEF8]" />
      </div>

      {/* Metric List matching Figma */}
      <div className="divide-y divide-gray-100">
        {stats.map((item) => (
          <div key={item.id} className="py-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-700 block">{item.label}</span>
              {item.tag && (
                <span
                  className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${getTagStyle(
                    item.tag.variant
                  )}`}
                >
                  {item.tag.label}
                </span>
              )}
            </div>
            <div className="text-base font-bold text-gray-900 font-mono tracking-tight">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FundamentalsSection;

