import { useState, useEffect } from 'react';
import { PhoneCall, ArrowDownRight } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import ApiStatusBadge from '../common/ApiStatusBadge';
import { COMMODITY_OPTION_TABS, COMMODITY_OPTION_CHAIN } from '../../data/commodityData';
import { fetchOptionChainData } from '../../services/marketApi';

export const CommodityOptionChain = () => {
  const [selectedCommodity, setSelectedCommodity] = useState('gold');
  const [selectedExpiry, setSelectedExpiry] = useState('16 Sep 25');
  const [chainData, setChainData] = useState(COMMODITY_OPTION_CHAIN);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCommodityChain() {
      try {
        const result = await fetchOptionChainData('MCX_INDEX|GOLD', '2025-09-16');
        if (isMounted) {
          if (result.isLive && result.formatted.rows.length > 0) {
            setChainData(result.formatted);
            setIsLive(true);
          } else {
            setChainData(COMMODITY_OPTION_CHAIN);
            setIsLive(false);
          }
        }
      } catch {
        if (isMounted) {
          setChainData(COMMODITY_OPTION_CHAIN);
          setIsLive(false);
        }
      }
    }

    loadCommodityChain();

    return () => {
      isMounted = false;
    };
  }, [selectedCommodity, selectedExpiry]);

  const { rows, spotPrice, spotChange, stats, expiries } = chainData;
  const firstHalfRows = rows.slice(0, 3);
  const secondHalfRows = rows.slice(3);

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs p-3.5 sm:p-4 overflow-hidden">
      {/* Title & View all with Live/Mock indicator */}
      <SectionHeader
        title="Option Chain"
        rightElement={<ApiStatusBadge isLive={isLive} />}
        onViewAll={() => console.log('View all Commodity Option Chain')}
      />

      {/* Commodity Tabs with Purple Underline */}
      <div className="flex items-center gap-6 border-b border-card-border overflow-x-auto no-scrollbar pb-1">
        {COMMODITY_OPTION_TABS.map((tab) => {
          const isActive = selectedCommodity === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCommodity(tab.id)}
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

      {/* Calls / Puts Top Indicators */}
      <div className="flex items-center justify-between py-2.5 px-2 text-xs font-bold text-primary">
        <div className="flex items-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Calls</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Puts</span>
          <ArrowDownRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto no-scrollbar -mx-2 sm:mx-0">
        <table className="w-full text-[11px] text-center border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] text-text-light font-medium">
              <th className="py-1.5 px-1 font-semibold">Vol</th>
              <th className="py-1.5 px-1 font-semibold">OI (L)</th>
              <th className="py-1.5 px-1 font-semibold">Call LTP</th>
              <th className="py-1.5 px-2 font-bold text-text-main bg-gray-50/70">STRIKE</th>
              <th className="py-1.5 px-1 font-semibold">Put LTP</th>
              <th className="py-1.5 px-1 font-semibold">OI (L)</th>
              <th className="py-1.5 px-1 font-semibold">Vol</th>
            </tr>
          </thead>
          <tbody>
            {/* Top 3 Strike Rows (Calls ITM yellow tint) */}
            {firstHalfRows.map((row) => (
              <tr key={row.strike} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-1 px-1 text-text-muted bg-amber-50/60 font-medium">{row.volCall}</td>
                <td className="py-1 px-1 bg-amber-50/60">
                  <div className="font-semibold text-text-main">{row.oiCall}</div>
                  <div className="text-[9px] text-success font-semibold">{row.oiCallChange}</div>
                </td>
                <td className="py-1 px-1 bg-amber-50/60">
                  <div className="font-semibold text-text-main">{row.ltpCall}</div>
                  <div className="text-[9px] text-danger font-semibold">{row.ltpCallChange}</div>
                </td>

                {/* Strike Column */}
                <td className="py-1 px-2 font-bold text-text-main bg-gray-50/90 whitespace-nowrap">
                  <div>{row.strike}</div>
                  <div className="text-[9px] text-text-light font-normal">PCR: {row.pcr}</div>
                </td>

                {/* Puts side */}
                <td className="py-1 px-1">
                  <div className="font-semibold text-text-main">{row.ltpPut}</div>
                  <div className="text-[9px] text-danger font-semibold">{row.ltpPutChange}</div>
                </td>
                <td className="py-1 px-1">
                  <div className="font-semibold text-text-main">{row.oiPut}</div>
                  <div className="text-[9px] text-success font-semibold">{row.oiPutChange}</div>
                </td>
                <td className="py-1 px-1 text-text-muted font-medium">{row.volPut}</td>
              </tr>
            ))}

            {/* Spot Price Highlight Banner */}
            <tr>
              <td colSpan={7} className="py-1.5 px-2 bg-emerald-50/60 border-y border-emerald-100">
                <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-emerald-800">
                  <span>SPOT PRICE:</span>
                  <span className="text-text-main">{spotPrice}</span>
                  <span className="text-danger font-semibold">{spotChange}</span>
                </div>
              </td>
            </tr>

            {/* Bottom 3 Strike Rows (Puts ITM yellow tint) */}
            {secondHalfRows.map((row) => (
              <tr key={row.strike} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-1 px-1 text-text-muted font-medium">{row.volCall}</td>
                <td className="py-1 px-1">
                  <div className="font-semibold text-text-main">{row.oiCall}</div>
                  <div className="text-[9px] text-success font-semibold">{row.oiCallChange}</div>
                </td>
                <td className="py-1 px-1">
                  <div className="font-semibold text-text-main">{row.ltpCall}</div>
                  <div className="text-[9px] text-danger font-semibold">{row.ltpCallChange}</div>
                </td>

                {/* Strike Column */}
                <td className="py-1 px-2 font-bold text-text-main bg-gray-50/90 whitespace-nowrap">
                  <div>{row.strike}</div>
                  <div className="text-[9px] text-text-light font-normal">PCR: {row.pcr}</div>
                </td>

                {/* Puts side (ITM yellow tint) */}
                <td className="py-1 px-1 bg-amber-50/60">
                  <div className="font-semibold text-text-main">{row.ltpPut}</div>
                  <div className="text-[9px] text-danger font-semibold">{row.ltpPutChange}</div>
                </td>
                <td className="py-1 px-1 bg-amber-50/60">
                  <div className="font-semibold text-text-main">{row.oiPut}</div>
                  <div className="text-[9px] text-success font-semibold">{row.oiPutChange}</div>
                </td>
                <td className="py-1 px-1 text-text-muted bg-amber-50/60 font-medium">{row.volPut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats Row */}
      <div className="mt-3 py-2 px-3 bg-gray-50 rounded-lg flex items-center justify-between text-[11px] font-medium text-text-muted flex-wrap gap-2">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="text-text-light">{stat.label}:</span>
            <span className="font-semibold text-text-main">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Expiry Date Pills */}
      <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pt-1">
        {expiries.map((exp) => {
          const isActive = selectedExpiry === exp;
          return (
            <button
              key={exp}
              type="button"
              onClick={() => setSelectedExpiry(exp)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary border border-primary/30'
                  : 'bg-gray-100 text-text-muted hover:text-text-main hover:bg-gray-200/60'
              }`}
            >
              {exp}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CommodityOptionChain;

