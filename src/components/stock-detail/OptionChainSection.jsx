import { useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';

/**
 * OptionChainSection
 * Conforms 1:1 to the Figma Turbo Web UI Option Chain screenshot:
 * - Expiry date pill buttons (09 Sep 25, 16 Sep 25 [Active], 23 Sep 25...)
 * - Advance ↗ orange button on top right
 * - Calls vs Puts header indicators with arrows
 * - 11-column Option Chain table with Strike & PCR in center column
 * - ITM soft yellow highlighting with green/red underbars
 */
export const OptionChainSection = ({ stockData }) => {
  const [selectedExpiry, setSelectedExpiry] = useState('16 Sep 25');

  const expiries = [
    '09 Sep 25',
    '16 Sep 25',
    '23 Sep 25',
    '30 Sep 25',
    '07 Oct 25',
    '14 Oct 25',
    '21 Oct 25',
  ];

  const strikes = [
    {
      strike: '28,400',
      pcr: '12.24',
      isItmCall: true,
      isItmPut: true,
      call: {
        vol: '5.58',
        oi: '10.20',
        oiChange: '-40.70%',
        ask: '5.58',
        bid: '5.58',
        ltp: '13.05',
        ltpChange: '+40.70%',
      },
      put: {
        ltp: '13.05',
        ltpChange: '+40.70%',
        bid: '5.58',
        ask: '5.58',
        oi: '10.20',
        oiChange: '-40.70%',
        vol: '5.58',
      },
    },
    {
      strike: '28,450',
      pcr: '11.80',
      isItmCall: true,
      isItmPut: false,
      call: {
        vol: '4.92',
        oi: '12.45',
        oiChange: '-15.20%',
        ask: '4.80',
        bid: '4.75',
        ltp: '18.20',
        ltpChange: '+25.10%',
      },
      put: {
        ltp: '8.40',
        ltpChange: '-18.40%',
        bid: '8.35',
        ask: '8.45',
        oi: '14.80',
        oiChange: '+12.50%',
        vol: '6.15',
      },
    },
    {
      strike: '28,500',
      pcr: '1.24',
      isItmCall: false,
      isItmPut: false,
      call: {
        vol: '8.12',
        oi: '18.90',
        oiChange: '+8.40%',
        ask: '2.40',
        bid: '2.35',
        ltp: '2.40',
        ltpChange: '-32.10%',
      },
      put: {
        ltp: '24.10',
        ltpChange: '+45.20%',
        bid: '24.00',
        ask: '24.20',
        oi: '21.50',
        oiChange: '+28.90%',
        vol: '9.40',
      },
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs p-3.5 space-y-3">
      {/* 1. Top Expiry Date Pills & Advance Button */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {expiries.map((exp) => {
            const isActive = selectedExpiry === exp;
            return (
              <button
                key={exp}
                type="button"
                onClick={() => setSelectedExpiry(exp)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#F1ECFE] text-[#603DC8] border border-[#D8CEF8]'
                    : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'
                }`}
              >
                {exp}
              </button>
            );
          })}
        </div>

        {/* Advance Button (Orange) */}
        <button
          type="button"
          className="border border-[#F79009] text-[#F79009] hover:bg-amber-50 rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
        >
          <span>Advance</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* 2. Calls vs Puts Sub-headers */}
      <div className="flex items-center justify-between text-xs font-bold text-[#603DC8] px-2 pt-1 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Calls</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Puts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 3. Option Chain Table */}
      <div className="overflow-x-auto -mx-3.5 px-3.5">
        <table className="w-full text-center text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="text-[11px] text-gray-500 font-semibold border-b border-gray-100">
              {/* Calls Side */}
              <th className="py-2 px-2 text-gray-500 font-medium">Vol</th>
              <th className="py-2 px-2 text-gray-500 font-medium">OI (L)</th>
              <th className="py-2 px-2 text-gray-500 font-medium">Ask</th>
              <th className="py-2 px-2 text-gray-500 font-medium">Bid</th>
              <th className="py-2 px-2 text-gray-700 font-semibold">Call LTP</th>

              {/* Center Strike */}
              <th className="py-2 px-3 text-gray-900 font-bold bg-gray-50/80">STRIKE</th>

              {/* Puts Side */}
              <th className="py-2 px-2 text-gray-700 font-semibold">Put LTP</th>
              <th className="py-2 px-2 text-gray-500 font-medium">Bid</th>
              <th className="py-2 px-2 text-gray-500 font-medium">Ask</th>
              <th className="py-2 px-2 text-gray-500 font-medium">OI (L)</th>
              <th className="py-2 px-2 text-gray-500 font-medium">Vol</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs">
            {strikes.map((row, idx) => (
              <tr
                key={idx}
                className={row.isItmCall && row.isItmPut ? 'bg-[#FEFDE8]' : 'hover:bg-gray-50/50'}
              >
                {/* Calls Data */}
                <td className="py-2 px-2 text-gray-700 font-medium">{row.call.vol}</td>
                <td className="py-2 px-2">
                  <span className="text-gray-900 font-medium block">{row.call.oi}</span>
                  <span className="text-[10px] text-[#F04438] font-semibold">{row.call.oiChange}</span>
                </td>
                <td className="py-2 px-2 text-gray-700 font-medium">{row.call.ask}</td>
                <td className="py-2 px-2 text-gray-700 font-medium">{row.call.bid}</td>
                <td className="py-2 px-2 border-r border-emerald-500/20">
                  <span className="text-gray-900 font-bold block">{row.call.ltp}</span>
                  <span className="text-[10px] text-[#039855] font-semibold">{row.call.ltpChange}</span>
                </td>

                {/* Center Strike with PCR */}
                <td className="py-2 px-3 bg-white font-bold border-x border-gray-100">
                  <span className="text-gray-900 font-bold text-xs block">{row.strike}</span>
                  <span className="text-[10px] text-gray-400 font-medium">PCR: {row.pcr}</span>
                </td>

                {/* Puts Data */}
                <td className="py-2 px-2 border-l border-rose-500/20">
                  <span className="text-gray-900 font-bold block">{row.put.ltp}</span>
                  <span className="text-[10px] text-[#039855] font-semibold">{row.put.ltpChange}</span>
                </td>
                <td className="py-2 px-2 text-gray-700 font-medium">{row.put.bid}</td>
                <td className="py-2 px-2 text-gray-700 font-medium">{row.put.ask}</td>
                <td className="py-2 px-2">
                  <span className="text-gray-900 font-medium block">{row.put.oi}</span>
                  <span className="text-[10px] text-[#F04438] font-semibold">{row.put.oiChange}</span>
                </td>
                <td className="py-2 px-2 text-gray-700 font-medium">{row.put.vol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OptionChainSection;

