import { useState } from 'react';
import { X, Trash2, Plus, Check } from 'lucide-react';

/**
 * PriceAlertDrawer (Figma 1:1 Match - Screenshot 1)
 * ---------------------------------------------------------------------------
 * Docked right sidebar for managing and creating Price Alerts:
 * - Lists active target price alerts for the stock (e.g. "Target Price: ₹155.10")
 * - Trash icon to delete existing alerts
 * - "Create New Alert +" pill button
 * - Form to specify custom target price & condition (Crosses Above / Crosses Below)
 * - Pinned bottom orange "Set Alert" CTA button
 */
export const PriceAlertDrawer = ({
  isOpen,
  onClose,
  stock,
  onSetAlert,
}) => {
  const stockName = stock?.displayName || stock?.name || 'Tata Steel Ltd.';
  const currentLtp = typeof stock?.lastTradedPrice === 'number'
    ? stock.lastTradedPrice
    : (typeof stock?.ltp === 'number' ? stock.ltp : 122.00);

  // Existing alerts state matching Screenshot 1: "Tata Steel Ltd. / Target Price: ₹155.10"
  const [alerts, setAlerts] = useState([
    {
      id: 'alert_1',
      stockName: stockName,
      targetPrice: Number((currentLtp * 1.05).toFixed(2)),
      condition: 'ABOVE',
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newTargetPrice, setNewTargetPrice] = useState(
    Number((currentLtp * 1.05).toFixed(2)).toString()
  );
  const [triggerCondition, setTriggerCondition] = useState('ABOVE'); // 'ABOVE' | 'BELOW'
  const [toastMessage, setToastMessage] = useState('');

  if (!isOpen) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  };

  const handleDeleteAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    showToast('Alert deleted');
  };

  const handleSaveAlert = (e) => {
    e?.preventDefault();
    const priceNum = parseFloat(newTargetPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const newAlert = {
      id: `alert_${Date.now()}`,
      stockName,
      targetPrice: priceNum,
      condition: triggerCondition,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setIsCreating(false);

    if (onSetAlert) {
      onSetAlert(newAlert);
    }
    showToast(`Target price ₹${priceNum.toFixed(2)} alert set!`);
  };

  return (
    <div
      style={{ top: '32px', height: 'calc(100vh - 32px)' }}
      className="fixed right-0 bottom-0 w-full sm:w-[390px] md:w-[410px] bg-white border-l border-gray-200/90 shadow-[-6px_0_20px_rgba(0,0,0,0.06)] z-[120] flex flex-col font-['Poppins',sans-serif] animate-slide-in-right select-none"
    >
      {/* Top Header & Close button */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-base sm:text-lg tracking-tight">
          Price Alert
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white border border-gray-200/80 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
          title="Close (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="mx-4 mt-2 px-3.5 py-2 bg-[#D2F9E5] text-[#00BE5C] text-xs font-semibold rounded-xl flex items-center gap-1.5 animate-in fade-in duration-100">
          <Check className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
        {/* Existing Alerts List (Matching Screenshot 1) */}
        <div className="space-y-3">
          {alerts.map((item) => (
            <div
              key={item.id}
              className="py-3 px-3.5 rounded-2xl bg-white border border-gray-100/90 shadow-2xs hover:shadow-xs flex items-center justify-between gap-3 transition-all"
            >
              <div>
                <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                  {item.stockName}
                </h4>
                <span className="text-xs text-gray-500 font-medium block mt-0.5">
                  Target Price: ₹{Number(item.targetPrice).toFixed(2)}
                </span>
              </div>

              {/* Red Trash Delete Button matching Screenshot 1 */}
              <button
                type="button"
                onClick={() => handleDeleteAlert(item.id)}
                className="p-1.5 text-[#F72F53] hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Delete Alert"
              >
                <Trash2 className="w-4 h-4 stroke-[1.8]" />
              </button>
            </div>
          ))}

          {alerts.length === 0 && !isCreating && (
            <div className="py-8 text-center text-gray-400 text-xs">
              No active alerts for {stockName}. Create one below.
            </div>
          )}
        </div>

        {/* Create New Alert Section */}
        {isCreating ? (
          <form
            onSubmit={handleSaveAlert}
            className="bg-[#F5F6F8] rounded-2xl p-3.5 space-y-3 border border-gray-200/80 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between pb-1 border-b border-gray-200/60">
              <span className="text-xs font-bold text-gray-800">New Alert</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-gray-700 text-xs"
              >
                Cancel
              </button>
            </div>

            {/* Target Price Card */}
            <div className="bg-white rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
              <span className="bg-[#EEEDFC] text-[#2A2B35] text-xs font-semibold px-3 py-1 rounded-full select-none">
                Target Price ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={newTargetPrice}
                onChange={(e) => setNewTargetPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder={currentLtp.toFixed(2)}
                className="w-28 text-right font-bold text-gray-900 text-base outline-none bg-transparent"
                autoFocus
              />
            </div>

            {/* Trigger Condition Selector */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium">Trigger condition:</span>
              <div className="bg-white p-0.5 rounded-full flex items-center border border-gray-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTriggerCondition('ABOVE')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    triggerCondition === 'ABOVE'
                      ? 'bg-[#FF7A00] text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  ≥ Above
                </button>
                <button
                  type="button"
                  onClick={() => setTriggerCondition('BELOW')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    triggerCondition === 'BELOW'
                      ? 'bg-[#FF7A00] text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  ≤ Below
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#FF7A00] hover:bg-[#E06C00] text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              Confirm Target Price
            </button>
          </form>
        ) : (
          /* "Create New Alert +" Button matching Screenshot 1 */
          <div>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="bg-[#FFF6ED] hover:bg-[#FFEAD8] text-[#FF7A00] font-semibold text-xs sm:text-sm px-4.5 py-2.5 rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-98"
            >
              <span>Create New Alert</span>
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>

      {/* Pinned Sticky Bottom Footer: Large Solid Orange "Set Alert" Button */}
      <div className="border-t border-gray-100 bg-white p-4">
        <button
          type="button"
          onClick={() => {
            if (isCreating) {
              handleSaveAlert();
            } else {
              showToast(`All ${alerts.length} alert(s) are active!`);
              setTimeout(onClose, 600);
            }
          }}
          className="w-full py-3 bg-[#FF7A00] hover:bg-[#E06C00] text-white text-base font-semibold rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center"
        >
          Set Alert
        </button>
      </div>
    </div>
  );
};

export default PriceAlertDrawer;
