import { useState, useMemo } from 'react';
import { X, Calculator, Plus, Trash2, ArrowRight, TrendingUp, Check } from 'lucide-react';
import { STOCK_DATA } from '../../data/marketData';
import CompanyLogo from '../common/CompanyLogo';

export const ProfitCalculatorModal = ({ isOpen, onClose, onApplyToPortfolio }) => {
  // Pre-populate with 3 popular diverse stocks
  const [selectedItems, setSelectedItems] = useState([
    {
      stock: STOCK_DATA[0] || { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', lastTradedPrice: 2984.50, open: 2962.00 },
      quantity: 25,
      avgPrice: 2900.00,
    },
    {
      stock: STOCK_DATA.find((s) => s.symbol === 'TATASTEEL') || { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', lastTradedPrice: 158.45, open: 155.00 },
      quantity: 100,
      avgPrice: 145.00,
    },
    {
      stock: STOCK_DATA.find((s) => s.symbol === 'INFY') || { symbol: 'INFY', name: 'Infosys Ltd', lastTradedPrice: 1845.60, open: 1820.00 },
      quantity: 40,
      avgPrice: 1780.00,
    },
  ]);

  const [appliedNotification, setAppliedNotification] = useState(false);

  // Calculations for each stock and total portfolio
  const calculatedRows = useMemo(() => {
    return selectedItems.map((item) => {
      const qty = Math.max(0, Number(item.quantity) || 0);
      const buyPrice = Math.max(0, Number(item.avgPrice) || 0);
      const ltp = Number(item.stock?.lastTradedPrice || item.stock?.price || buyPrice);

      const invested = Number((qty * buyPrice).toFixed(2));
      const currentValue = Number((qty * ltp).toFixed(2));
      const profit = Number((currentValue - invested).toFixed(2));
      const profitPercent = invested > 0 ? Number(((profit / invested) * 100).toFixed(2)) : 0;
      const isProfitable = profit >= 0;

      return {
        ...item,
        qty,
        buyPrice,
        ltp,
        invested,
        currentValue,
        profit,
        profitPercent,
        isProfitable,
      };
    });
  }, [selectedItems]);

  const portfolioTotals = useMemo(() => {
    const totalInvested = calculatedRows.reduce((sum, r) => sum + r.invested, 0);
    const totalCurrentValue = calculatedRows.reduce((sum, r) => sum + r.currentValue, 0);
    const totalProfit = Number((totalCurrentValue - totalInvested).toFixed(2));
    const totalProfitPercent = totalInvested > 0 ? Number(((totalProfit / totalInvested) * 100).toFixed(2)) : 0;
    const isProfitable = totalProfit >= 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfit,
      totalProfitPercent,
      isProfitable,
    };
  }, [calculatedRows]);

  if (!isOpen) return null;

  const handleUpdateItem = (index, field, value) => {
    setSelectedItems((prev) => {
      const next = [...prev];
      if (field === 'stock') {
        const found = STOCK_DATA.find((s) => s.symbol === value);
        if (found) {
          next[index] = {
            ...next[index],
            stock: found,
            avgPrice: Number((found.lastTradedPrice * 0.97).toFixed(2)),
          };
        }
      } else {
        next[index] = {
          ...next[index],
          [field]: value,
        };
      }
      return next;
    });
  };

  const handleApply = () => {
    if (onApplyToPortfolio) {
      onApplyToPortfolio(calculatedRows);
    }
    setAppliedNotification(true);
    setTimeout(() => {
      setAppliedNotification(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none font-['Poppins',sans-serif] animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-white to-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#603DC8]/10 text-[#603DC8] flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">
                Portfolio Profit & Returns Simulator
              </h3>
              <p className="text-xs text-gray-500">
                Calculate total profit if you buy 3 different stocks for different quantities
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* Top Combined Results Banner */}
          <div className="bg-[#FAF9FF] border border-[#ECE9FE] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 border-b border-purple-100/70 pb-2">
              <span className="text-xs font-semibold text-[#603DC8] uppercase tracking-wider">
                Combined 3-Stock Portfolio Outcome
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  portfolioTotals.isProfitable
                    ? 'bg-[#D2F9E5] text-[#00BE5C]'
                    : 'bg-[#FEE2E2] text-[#F72F53]'
                }`}
              >
                {portfolioTotals.isProfitable ? '+' : ''}
                {portfolioTotals.totalProfitPercent}% ROI
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-500 font-medium block mb-1">Total Invested</span>
                <span className="font-bold text-gray-900 text-sm sm:text-base">
                  ₹{portfolioTotals.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block mb-1">Current Value</span>
                <span className="font-bold text-[#603DC8] text-sm sm:text-base">
                  ₹{portfolioTotals.totalCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block mb-1">Total Profit / Loss</span>
                <span
                  className={`font-bold text-sm sm:text-base ${
                    portfolioTotals.isProfitable ? 'text-[#00BE5C]' : 'text-[#F72F53]'
                  }`}
                >
                  {portfolioTotals.isProfitable ? '+ ' : ''}₹
                  {portfolioTotals.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block mb-1">Net Returns %</span>
                <span
                  className={`font-bold text-sm sm:text-base ${
                    portfolioTotals.isProfitable ? 'text-[#00BE5C]' : 'text-[#F72F53]'
                  }`}
                >
                  {portfolioTotals.isProfitable ? '+ ' : ''}
                  {portfolioTotals.totalProfitPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* 3 Configurable Stock Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Configure Your 3 Stocks & Quantities
            </h4>

            {calculatedRows.map((row, idx) => (
              <div
                key={`stock-sim-${idx}`}
                className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <CompanyLogo name={row.stock?.name} size={30} />
                    <div>
                      {/* Stock Selector Dropdown */}
                      <select
                        value={row.stock?.symbol}
                        onChange={(e) => handleUpdateItem(idx, 'stock', e.target.value)}
                        className="font-semibold text-gray-900 text-xs sm:text-sm bg-transparent outline-none cursor-pointer border-b border-dashed border-gray-300 pb-0.5 hover:border-gray-600"
                      >
                        {STOCK_DATA.map((s) => (
                          <option key={s.symbol} value={s.symbol}>
                            {s.name} ({s.symbol}) - LTP ₹{s.lastTradedPrice}
                          </option>
                        ))}
                      </select>
                      <span className="block text-[11px] text-gray-500">
                        Live LTP: ₹{row.ltp.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Stock Profit Badge */}
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                        row.isProfitable
                          ? 'bg-[#D2F9E5] text-[#00BE5C]'
                          : 'bg-[#FEE2E2] text-[#F72F53]'
                      }`}
                    >
                      {row.isProfitable ? '+' : ''}₹{row.profit.toLocaleString('en-IN')} ({row.profitPercent}%)
                    </span>
                  </div>
                </div>

                {/* Input Fields: Quantity & Buy Price */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100 text-xs">
                  <div>
                    <label className="text-gray-500 font-medium block text-[11px] mb-1">
                      Quantity (Shares)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 font-semibold text-gray-900 outline-none focus:border-[#FF7A00]"
                    />
                  </div>

                  <div>
                    <label className="text-gray-500 font-medium block text-[11px] mb-1">
                      Avg Buy Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={row.avgPrice}
                      onChange={(e) => handleUpdateItem(idx, 'avgPrice', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 font-semibold text-gray-900 outline-none focus:border-[#FF7A00]"
                    />
                  </div>

                  <div>
                    <span className="text-gray-500 font-medium block text-[11px] mb-1">
                      Total Invested
                    </span>
                    <span className="font-semibold text-gray-900 block py-1.5">
                      ₹{row.invested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 font-medium block text-[11px] mb-1">
                      Current Value
                    </span>
                    <span className="font-semibold text-gray-900 block py-1.5">
                      ₹{row.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500 hidden sm:block">
            Calculated formula: <code className="bg-gray-200/70 px-1 py-0.5 rounded text-[11px]">(LTP - AvgPrice) * Qty</code>
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-200/80 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#FF7A00] hover:bg-[#E06D00] text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              {appliedNotification ? (
                <>
                  <Check className="w-4 h-4" /> Added to Portfolio!
                </>
              ) : (
                <>
                  Add these 3 Stocks to My Holdings & Positions <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitCalculatorModal;

