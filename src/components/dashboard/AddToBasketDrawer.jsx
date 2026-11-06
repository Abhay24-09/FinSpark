import { useState } from 'react';
import { X, Check, Plus } from 'lucide-react';

/**
 * AddToBasketDrawer (Figma 1:1 Match - Screenshot 3)
 * ---------------------------------------------------------------------------
 * Docked right sidebar for adding stock into multi-leg Baskets:
 * - List of available baskets with multi-select checkboxes:
 *   - Checkbox [ ]
 *   - Basket Name & items count (e.g. "10 items")
 * - "Create New Basket +" pill button (opens inline creation form)
 * - Pinned sticky bottom orange "Add to Basket" CTA button (#FF7A00)
 */
export const AddToBasketDrawer = ({
  isOpen,
  onClose,
  stock,
  onAddToBasket,
}) => {
  const stockName = stock?.displayName || stock?.name || 'Selected Stock';

  // Available baskets matching Screenshot 3 / 7
  const [baskets, setBaskets] = useState([
    { id: 'b_1', name: 'Basket Name', itemsCount: 10 },
    { id: 'b_2', name: 'Basket Name', itemsCount: 10 },
    { id: 'b_3', name: 'Momentum Growth', itemsCount: 8 },
  ]);

  const [selectedBasketIds, setSelectedBasketIds] = useState([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newBasketName, setNewBasketName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleSelectBasket = (id) => {
    setSelectedBasketIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateNewBasket = (e) => {
    e?.preventDefault();
    const trimmed = newBasketName.trim();
    if (!trimmed) return;

    const newId = `b_${Date.now()}`;
    const newEntry = {
      id: newId,
      name: trimmed,
      itemsCount: 0,
    };

    setBaskets((prev) => [...prev, newEntry]);
    setSelectedBasketIds((prev) => [...prev, newId]);
    setNewBasketName('');
    setIsCreatingNew(false);
  };

  const handleConfirmAdd = () => {
    if (selectedBasketIds.length === 0) return;

    if (onAddToBasket) {
      onAddToBasket({
        stock,
        basketIds: selectedBasketIds,
        basketNames: baskets
          .filter((b) => selectedBasketIds.includes(b.id))
          .map((b) => b.name),
      });
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
            Add to Basket
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
        {/* Basket Items List with Checkboxes matching Screenshot 3 */}
        <div className="space-y-3">
          {baskets.map((basket) => {
            const isChecked = selectedBasketIds.includes(basket.id);
            return (
              <div
                key={basket.id}
                onClick={() => toggleSelectBasket(basket.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  isChecked
                    ? 'border-[#FF7A00] bg-[#FFF9F3] shadow-xs'
                    : 'border-gray-200/80 bg-white hover:border-gray-300'
                }`}
              >
                {/* Checkbox square */}
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                    isChecked
                      ? 'border-[#FF7A00] bg-[#FF7A00] text-white'
                      : 'border-gray-300 bg-white text-transparent'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                </div>

                {/* Basket Name & Items Count matching Screenshot 3 */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm leading-snug truncate">
                    {basket.name}
                  </h4>
                  <span className="text-xs text-gray-400 font-normal block mt-0.5">
                    {basket.itemsCount} {basket.itemsCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create New Basket Section */}
        {isCreatingNew ? (
          <form
            onSubmit={handleCreateNewBasket}
            className="bg-[#F5F6F8] rounded-2xl p-3.5 space-y-2.5 border border-gray-200/80 animate-in fade-in duration-150"
          >
            <span className="text-xs font-bold text-gray-800 block">Create Basket</span>
            <input
              type="text"
              placeholder="Enter basket name..."
              value={newBasketName}
              onChange={(e) => setNewBasketName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#FF7A00] rounded-xl outline-none font-medium"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-[#FF7A00] hover:bg-[#E06C00] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Create & Select
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setNewBasketName('');
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* "Create New Basket +" Button matching Screenshot 3 */
          <div>
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="bg-[#FFF6ED] hover:bg-[#FFEAD8] text-[#FF7A00] font-semibold text-xs sm:text-sm px-4.5 py-2.5 rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-98"
            >
              <span>Create New Basket</span>
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>

      {/* Pinned Sticky Bottom Footer: Orange "Add to Basket" CTA Button */}
      <div className="border-t border-gray-100 bg-white p-4">
        <button
          type="button"
          onClick={handleConfirmAdd}
          disabled={selectedBasketIds.length === 0}
          className={`w-full py-3 text-white text-base font-semibold rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center ${
            isSuccess
              ? 'bg-gray-800'
              : selectedBasketIds.length === 0
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : 'bg-[#FF7A00] hover:bg-[#E06C00]'
          }`}
        >
          {isSuccess ? '✓ Added to Basket' : 'Add to Basket'}
        </button>
      </div>
    </div>
  );
};

export default AddToBasketDrawer;
