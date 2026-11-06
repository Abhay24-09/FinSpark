import { useState, useMemo } from 'react';
import { X, Calendar, ArrowUpDown, Check } from 'lucide-react';

/**
 * SipOrderDrawer (Figma 1:1 Match - Screenshot 2)
 * ---------------------------------------------------------------------------
 * Docked right sidebar for configuring and placing Stock SIP orders:
 * - Card 1: Quantity Card with [ Quantity ↑↓ ] lavender badge and number input
 * - Card 2: Frequency Selector [ SIP ] lavender badge with Everyday/Weekly/Monthly & purple calendar icon
 * - Row 3: 1st Payment & Next SIP Date calculated dynamically
 * - Row 4: Yellow notice banner: "SIP order are executed at Market Price..."
 * - Bottom CTA: Green "Place SIP Order" (#00BE5C)
 */
export const SipOrderDrawer = ({
  isOpen,
  onClose,
  stock,
  onPlaceSipOrder,
}) => {
  const stockName = stock?.displayName || stock?.name || 'Reliance Power';
  const currentLtp = typeof stock?.lastTradedPrice === 'number'
    ? stock.lastTradedPrice
    : (typeof stock?.ltp === 'number' ? stock.ltp : 44.78);

  const [quantity, setQuantity] = useState('12');
  const [frequency, setFrequency] = useState('Everyday'); // 'Everyday' | 'Weekly' | 'Monthly'
  const [isSuccess, setIsSuccess] = useState(false);

  // Calculate dates dynamically
  const dates = useMemo(() => {
    const today = new Date();
    const formatDate = (d) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    };

    const firstPayment = formatDate(today);

    const nextDate = new Date(today);
    if (frequency === 'Everyday') {
      nextDate.setDate(today.getDate() + 1);
    } else if (frequency === 'Weekly') {
      nextDate.setDate(today.getDate() + 7);
    } else if (frequency === 'Monthly') {
      nextDate.setMonth(today.getMonth() + 1);
    }

    const nextSip = formatDate(nextDate);

    return { firstPayment, nextSip };
  }, [frequency]);

  if (!isOpen) return null;

  const handleQuantityChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setQuantity(val);
  };

  const handleQuantityKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setQuantity((prev) => String((Number(prev) || 0) + 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setQuantity((prev) => String(Math.max(1, (Number(prev) || 0) - 1)));
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const numQty = Number(quantity) || 1;

    const sipOrder = {
      id: `sip_${Date.now()}`,
      symbol: stock?.symbol || 'RPOWER',
      name: stockName,
      qty: numQty,
      frequency,
      price: currentLtp,
      orderType: 'SIP',
      firstPaymentDate: dates.firstPayment,
      nextSipDate: dates.nextSip,
      status: 'Active',
      time: '09:30:00',
    };

    if (onPlaceSipOrder) {
      onPlaceSipOrder(sipOrder);
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div
      style={{ top: '32px', height: 'calc(100vh - 32px)' }}
      className="fixed right-0 bottom-0 w-full sm:w-[390px] md:w-[410px] bg-white border-l border-gray-200/90 shadow-[-6px_0_20px_rgba(0,0,0,0.06)] z-[120] flex flex-col font-['Poppins',sans-serif] animate-slide-in-right select-none"
    >
      {/* Top Header & Close button */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-base sm:text-lg tracking-tight">
            Stock SIP
          </h3>
          <span className="text-xs text-gray-400 font-medium">{stockName}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white border border-gray-200/80 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
          title="Close (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 no-scrollbar">
        {/* Quantity Card matching Screenshot 2 */}
        <div className="bg-[#F5F6F8] rounded-2xl p-2.5 sm:p-3 space-y-2">
          <div className="bg-white rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
            <span className="bg-[#EEEDFC] text-[#2A2B35] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 select-none">
              <span>Quantity</span>
              <ArrowUpDown className="w-3 h-3 text-gray-500" />
            </span>

            <input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={handleQuantityChange}
              onKeyDown={handleQuantityKeyDown}
              placeholder="12"
              className="w-24 text-right font-bold text-gray-900 text-base sm:text-lg outline-none bg-transparent"
            />
          </div>

          {/* Frequency Card [ SIP ] everyday matching Screenshot 2 */}
          <div className="bg-white rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
            <span className="bg-[#EEEDFC] text-[#2A2B35] text-xs font-semibold px-3 py-1 rounded-full select-none">
              SIP
            </span>

            <div className="flex items-center gap-2">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-gray-800 bg-transparent outline-none cursor-pointer text-right"
              >
                <option value="Everyday">Everyday</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
              <Calendar className="w-4 h-4 text-[#603DC8] shrink-0" />
            </div>
          </div>
        </div>

        {/* Payment Dates row matching Screenshot 2 */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div>
            <span className="text-[11px] text-gray-400 font-normal block">
              1st Payment:
            </span>
            <span className="text-xs font-semibold text-gray-800 block mt-0.5">
              {dates.firstPayment}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-gray-400 font-normal block">
              Next SIP Date:
            </span>
            <span className="text-xs font-semibold text-gray-800 block mt-0.5">
              {dates.nextSip}
            </span>
          </div>
        </div>

        {/* Yellow Notice Banner matching Screenshot 2 */}
        <div className="bg-[#FEF7CE]/80 border border-[#FDE68A]/70 rounded-xl p-3 text-xs text-gray-800 leading-relaxed font-normal">
          SIP order are executed at Market Price. Order will be placed at 9:30 AM on set date. Please ensure that funds are in the account.
        </div>
      </div>

      {/* Pinned Sticky Bottom Footer: Green "Place SIP Order" CTA Button */}
      <div className="border-t border-gray-100 bg-white p-4">
        <button
          type="button"
          onClick={handleSubmit}
          className={`w-full py-3 text-white text-base font-semibold rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center ${
            isSuccess ? 'bg-gray-800' : 'bg-[#00BE5C] hover:bg-[#00AA52]'
          }`}
        >
          {isSuccess ? '✓ SIP Scheduled' : 'Place SIP Order'}
        </button>
      </div>
    </div>
  );
};

export default SipOrderDrawer;
