import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CompanyLogo from '../common/CompanyLogo';

/**
 * FnoSection
 * Conforms 1:1 to the Figma Turbo Web UI FnO screenshot:
 * - Two-column layout: Futures (Left) and Options (Right)
 * - Futures list: AUG FUT, SEP FUT, OCT FUT with price and change
 * - Options list: Strike CE/PE cards with Expiry filter dropdown
 */
export const FnoSection = ({ stockData }) => {
  const [selectedExpiry, setSelectedExpiry] = useState('28 Aug 25');
  const [isExpiryOpen, setIsExpiryOpen] = useState(false);

  const cleanSymbol = stockData?.tradingSymbol
    ? stockData.tradingSymbol.replace('-EQ', '')
    : stockData?.symbol || 'TATASTEEL';

  const expiries = ['28 Aug 25', '25 Sep 25', '30 Oct 25'];

  const futures = [
    {
      id: 'fut_1',
      name: `${cleanSymbol} AUG FUT`,
      date: '28 AUG 25',
      price: '₹159.05',
      change: '-1.24(0.90%)',
      isPositive: false,
    },
    {
      id: 'fut_2',
      name: `${cleanSymbol} SEP FUT`,
      date: '25 SEP 25',
      price: '₹159.05',
      change: '-1.18(0.73%)',
      isPositive: false,
    },
    {
      id: 'fut_3',
      name: `${cleanSymbol} OCT FUT`,
      date: '30 OCT 25',
      price: '₹160.80',
      change: '-1.05(0.65%)',
      isPositive: false,
    },
  ];

  const options = [
    {
      id: 'opt_1',
      name: `${cleanSymbol} AUG 25 157.5 CE`,
      date: '28 AUG 25',
      price: '₹4.20',
      change: '-0.90(-17.82%)',
      isPositive: false,
    },
    {
      id: 'opt_2',
      name: `${cleanSymbol} AUG 25 260 CE`,
      date: '25 SEP 25',
      price: '₹2.95',
      change: '-0.75(-20.55%)',
      isPositive: false,
    },
    {
      id: 'opt_3',
      name: `${cleanSymbol} AUG 25 160 PE`,
      date: '28 AUG 25',
      price: '₹3.10',
      change: '+0.45(+17.00%)',
      isPositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start text-xs">
      {/* 1. Left Column: Futures */}
      <div className="space-y-2.5">
        <h4 className="text-sm font-bold text-gray-900 px-1">Futures</h4>

        <div className="space-y-2">
          {futures.map((fut) => (
            <div
              key={fut.id}
              className="bg-white rounded-xl border border-gray-200/90 shadow-xs p-3 flex items-center justify-between hover:bg-gray-50/70 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                {/* Brand circle logo */}
                <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  <CompanyLogo name={cleanSymbol} size={28} />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-gray-900">{fut.name}</h5>
                  <span className="text-[11px] text-gray-400 font-medium block">
                    {fut.date}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-xs text-gray-900 block">{fut.price}</span>
                <span
                  className={`text-[11px] font-semibold ${
                    fut.isPositive ? 'text-[#039855]' : 'text-[#F04438]'
                  }`}
                >
                  {fut.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Right Column: Options */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-bold text-gray-900">Options</h4>

          {/* Expiry Dropdown Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExpiryOpen((prev) => !prev)}
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>{selectedExpiry}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {isExpiryOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[110px]">
                {expiries.map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => {
                      setSelectedExpiry(exp);
                      setIsExpiryOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 cursor-pointer ${
                      selectedExpiry === exp ? 'font-bold text-primary' : 'text-gray-700'
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {options.map((opt) => (
            <div
              key={opt.id}
              className="bg-white rounded-xl border border-gray-200/90 shadow-xs p-3 flex items-center justify-between hover:bg-gray-50/70 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  <CompanyLogo name={cleanSymbol} size={28} />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-gray-900">{opt.name}</h5>
                  <span className="text-[11px] text-gray-400 font-medium block">
                    {opt.date}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-xs text-gray-900 block">{opt.price}</span>
                <span
                  className={`text-[11px] font-semibold ${
                    opt.isPositive ? 'text-[#039855]' : 'text-[#F04438]'
                  }`}
                >
                  {opt.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FnoSection;

