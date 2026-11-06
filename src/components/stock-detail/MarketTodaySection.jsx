import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * MarketTodaySection (Overview Tab)
 * Conforms 1:1 to the Figma Turbo Web UI Overview screenshot:
 * - Title: Market Today
 * - Today Low (152.12) / Today High (162.11) with purple bar and black pointer (▲)
 * - 52 W Low (140.72) / 52 W High (168.90) with purple bar and black pointer (▲)
 * - Key metrics grid
 */
export const MarketTodaySection = ({ stockData }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isBSE = stockData?.exchange === 'BSE';
  const ltp = typeof stockData?.lastTradedPrice === 'number' ? stockData.lastTradedPrice : (isBSE ? 67.45 : 67.54);
  const dayLow = typeof stockData?.low === 'number' ? stockData.low : (isBSE ? 66.70 : 66.80);
  const dayHigh = typeof stockData?.high === 'number' ? stockData.high : (isBSE ? 69.25 : 69.40);
  const yearLow = isBSE ? 140.50 : 140.72;
  const yearHigh = isBSE ? 168.50 : 168.90;

  const open = typeof stockData?.open === 'number' ? stockData.open : (isBSE ? 68.10 : 68.20);
  const close = typeof stockData?.close === 'number' ? stockData.close : 68.62;
  const vwap = typeof stockData?.averageTradedPrice === 'number' ? stockData.averageTradedPrice : (isBSE ? 67.85 : 67.92);
  const volume = stockData?.volumeTradedToday || (isBSE ? 3812400 : 12450890);
  const totalBuyQty = stockData?.totalBuyQuantity || (isBSE ? 11245600 : 33275045);
  const totalSellQty = stockData?.totalSellQuantity || (isBSE ? 18450200 : 57875307);

  const lowerCircuit = Number((close * 0.95).toFixed(2));
  const upperCircuit = Number((close * 1.05).toFixed(2));

  // Percentage for pointer position
  const dayRangePct = dayHigh > dayLow ? Math.min(100, Math.max(0, ((ltp - dayLow) / (dayHigh - dayLow)) * 100)) : 62;
  const yearRangePct = yearHigh > yearLow ? Math.min(100, Math.max(0, ((ltp - yearLow) / (yearHigh - yearLow)) * 100)) : 58;

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs p-4 space-y-4">
      {/* Header with Title, Exchange Badge, and Collapse Button */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">Market Today</h3>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
            isBSE
              ? 'bg-[#FFF4ED] text-[#FF5900] border-[#FFD8C2]'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {isBSE ? 'BSE' : 'NSE'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 cursor-pointer transition-colors"
        >
          {isCollapsed ? (
            <>
              Expand <ChevronDown className="w-4 h-4" />
            </>
          ) : (
            <>
              Collapse <ChevronUp className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
          {/* 1. Today Low / High Range Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="text-left">
                <span className="text-gray-500 font-medium block text-[11px]">Today Low</span>
                <span className="font-bold text-gray-900 text-sm">
                  {typeof dayLow === 'number' ? dayLow.toFixed(2) : dayLow}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 font-medium block text-[11px]">Today High</span>
                <span className="font-bold text-gray-900 text-sm">
                  {typeof dayHigh === 'number' ? dayHigh.toFixed(2) : dayHigh}
                </span>
              </div>
            </div>

            {/* Solid purple bar track with black pointer underneath matching Figma */}
            <div className="relative w-full pt-1 pb-3">
              <div className="w-full h-1.5 bg-[#603DC8] rounded-full" />
              {/* Upward pointing triangle marker */}
              <div
                className="absolute top-2.5 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
                style={{ left: `${dayRangePct}%` }}
              >
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-black" />
              </div>
            </div>
          </div>

          {/* 2. 52 W Low / High Range Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="text-left">
                <span className="text-gray-500 font-medium block text-[11px]">52 W Low</span>
                <span className="font-bold text-gray-900 text-sm">
                  {typeof yearLow === 'number' ? yearLow.toFixed(2) : yearLow}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 font-medium block text-[11px]">52 W High</span>
                <span className="font-bold text-gray-900 text-sm">
                  {typeof yearHigh === 'number' ? yearHigh.toFixed(2) : yearHigh}
                </span>
              </div>
            </div>

            {/* Solid purple bar track with black pointer underneath matching Figma */}
            <div className="relative w-full pt-1 pb-3">
              <div className="w-full h-1.5 bg-[#603DC8] rounded-full" />
              {/* Upward pointing triangle marker */}
              <div
                className="absolute top-2.5 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
                style={{ left: `${yearRangePct}%` }}
              >
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-black" />
              </div>
            </div>
          </div>

          {/* Key Statistics Grid */}
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              Key Metrics &amp; Price Band
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-gray-50/80 rounded-lg border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Open Price</span>
                <span className="font-bold text-gray-900 text-sm">₹{Number(open).toFixed(2)}</span>
              </div>

              <div className="p-2.5 bg-gray-50/80 rounded-lg border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Previous Close</span>
                <span className="font-bold text-gray-900 text-sm">₹{Number(close).toFixed(2)}</span>
              </div>

              <div className="p-2.5 bg-gray-50/80 rounded-lg border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Avg Traded Price (ATP)</span>
                <span className="font-bold text-gray-900 text-sm">₹{Number(vwap).toFixed(2)}</span>
              </div>

              <div className="p-2.5 bg-gray-50/80 rounded-lg border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Volume (Shares)</span>
                <span className="font-bold text-gray-900 text-sm">{volume.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-100">
                <span className="text-[11px] text-rose-700 block font-medium">Lower Circuit (5%)</span>
                <span className="font-bold text-rose-600 text-sm">₹{lowerCircuit.toFixed(2)}</span>
              </div>

              <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <span className="text-[11px] text-emerald-700 block font-medium">Upper Circuit (5%)</span>
                <span className="font-bold text-emerald-600 text-sm">₹{upperCircuit.toFixed(2)}</span>
              </div>

              <div className="p-2.5 bg-gray-50/80 rounded-lg border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Total Buy Qty</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {totalBuyQty.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-2.5 bg-gray-50/80 rounded-lg border border-gray-100">
                <span className="text-[11px] text-gray-500 block">Total Sell Qty</span>
                <span className="font-bold text-rose-700 text-sm">
                  {totalSellQty.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketTodaySection;
