import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Bookmark,
  MoreVertical,
  Pin,
  Bell,
  Share2,
  Clock,
  ShoppingBag,
  ListFilter,
  Gift,
  X,
  GripVertical,
} from 'lucide-react';
import ExchangeToggle from '../common/ExchangeToggle';

/**
 * StockHeader
 * ---------------------------------------------------------------------------
 * Stock detail header matching the Figma prototype:
 * - Stock Name (e.g. Reliance Power) & Exchange Badges (NSE / BSE in soft orange)
 * - Live LTP, Absolute Change, and Percentage Change
 * - Action buttons: Sell (Solid Red), Buy (Solid Green)
 * - Three Toggles near Add to Watchlist: Bookmark, Pin, and Bulk-Action Dropdown
 *   (Strictly rounded-none on all divs and gaps not greater than 2px)
 * - Pin Scrip to Header Pop-up Modal (States 1 & 2) with Orange Save button
 */
export const StockHeader = ({
  stock,
  selectedExchange = 'NSE',
  onExchangeChange,
  onBack,
  onBuyClick,
  onSellClick,
  onOpenOptionChain,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedPinId, setSelectedPinId] = useState('curr_stock');
  const dropdownRef = useRef(null);

  // Maintain local active exchange state synchronized with prop
  const [internalExchange, setInternalExchange] = useState(selectedExchange || stock?.exchange || 'NSE');

  useEffect(() => {
    if (selectedExchange) {
      setInternalExchange(selectedExchange);
    } else if (stock?.exchange) {
      setInternalExchange(stock.exchange);
    }
  }, [selectedExchange, stock?.exchange]);

  const currentExchange = selectedExchange || internalExchange || stock?.exchange || 'NSE';

  const handleExchangeToggle = (exchange) => {
    setInternalExchange(exchange);
    if (onExchangeChange) {
      onExchangeChange(exchange);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = stock?.displayName || stock?.name || 'Reliance Power';
  const price = typeof stock?.lastTradedPrice === 'number' ? stock.lastTradedPrice : 67.54;
  const change = stock?.absoluteChange !== undefined ? stock.absoluteChange : -1.08;
  const changePct = stock?.percentChange !== undefined ? stock.percentChange : -1.58;

  // Check whether the stock is below today's opening price (if below open -> red, otherwise green)
  const openPrice = typeof stock?.open === 'number'
    ? stock.open
    : (typeof stock?.openPrice === 'number'
      ? stock.openPrice
      : (typeof stock?.openRaw === 'number'
        ? stock.openRaw
        : (stock?.open ? parseFloat(String(stock.open).replace(/[^0-9.-]/g, '')) : undefined)));

  const numPrice = typeof price === 'number'
    ? price
    : parseFloat(String(price).replace(/[^0-9.-]/g, ''));

  const isBelowOpen = openPrice !== undefined && !isNaN(openPrice) && openPrice > 0
    ? numPrice < openPrice
    : (typeof change === 'number' ? change < 0 : (stock?.isPositive !== undefined ? !stock.isPositive : false));

  const isPositive = !isBelowOpen;

  const headerScripList = [
    { id: 'curr_stock', name: displayName, exchange: currentExchange },
    { id: 'nifty_50', name: 'NIFTY 50', exchange: 'NSE' },
    { id: 'nifty_100', name: 'NIFTY 100', exchange: 'NSE' },
    { id: 'nifty_bank', name: 'NIFTY BANK', exchange: 'NSE' },
    { id: 'sensex', name: 'SENSEX', exchange: 'BSE' },
    { id: 'nifty_mid_select', name: 'NIFTY MID SELECTE', exchange: 'NSE' },
    { id: 'nifty_midcap', name: 'NIFTY MIDCAP', exchange: 'NSE' },
  ];

  const handleSavePin = () => {
    if (selectedPinId === 'curr_stock' || selectedPinId) {
      setIsPinned(true);
    }
    setIsPinModalOpen(false);
  };

  return (
    <div className="bg-white border border-gray-200/90 shadow-xs px-4 py-3 sm:py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Stock Title, Exchange Badges (NSE / BSE), Price & Change */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            {/* Title & Exchange Pills */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {displayName}
              </h1>

              {/* Single Exchange Toggle Button (NSE ⇄ BSE) matching user design */}
              <div className="flex items-center relative z-20">
                <ExchangeToggle
                  currentExchange={currentExchange}
                  onToggle={handleExchangeToggle}
                />
              </div>
            </div>

            {/* Price & Change Sub-text matching Figma */}
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-bold text-gray-900 font-mono">
                ₹{typeof price === 'number' ? price.toFixed(2) : price}
              </span>
              <span
                className={`text-xs font-semibold font-mono ${
                  isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {isPositive ? '+' : ''}
                {typeof change === 'number' ? change.toFixed(2) : change} (
                {isPositive ? '+' : ''}
                {typeof changePct === 'number' ? changePct.toFixed(2) : changePct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons matching exact user design (no boxes/borders) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Sell Button (Solid Red #F72F53 with reduced roundness) */}
          <button
            type="button"
            data-order-trigger="true"
            onClick={onSellClick}
            className="h-10 px-6 sm:px-8 rounded-2xl text-sm font-semibold bg-[#EB5757] hover:bg-[#E02647] text-white transition-colors cursor-pointer select-none flex items-center justify-center"
          >
            Sell
          </button>

          {/* Buy Button (Solid Green #00BE5C with reduced roundness) */}
          <button
            type="button"
            data-order-trigger="true"
            onClick={onBuyClick}
            className="h-10 px-6 sm:px-8 rounded-2xl text-sm font-semibold bg-[#27AE60]  text-white transition-colors cursor-pointer select-none flex items-center justify-center"
          >
            Buy
          </button>

          {/* Bookmark / Watchlist Button (Soft Squircle #F6F6F6, NO border/box) */}
          <button
            type="button"
            onClick={() => setIsBookmarked((prev) => !prev)}
            className="w-10 h-10 rounded-2xl bg-[#F6F6F6] hover:bg-[#ECECEC] text-[#222222] flex items-center justify-center transition-colors cursor-pointer select-none"
            title={isBookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current text-[#F72F53]' : ''}`} />
          </button>

          {/* More Options / Bulk-Action Dropdown (Soft Squircle #F6F6F6, NO border/box) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="w-10 h-10 rounded-2xl bg-[#F6F6F6] hover:bg-[#ECECEC] text-[#222222] flex items-center justify-center transition-colors cursor-pointer select-none"
              title="More Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Bulk-Action Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 shadow-xl z-50 rounded-xl py-1 min-w-[210px] animate-in fade-in duration-100 flex flex-col">
                {/* 1. Price Alert (02) */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full px-3.5 py-2 flex items-center justify-between text-left text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#603DC8]" />
                    <span>Price Alert</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-semibold">(02)</span>
                </button>

                {/* 2. Share Scrip */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (navigator.share) {
                      navigator.share({ title: displayName, url: window.location.href }).catch(() => {});
                    }
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 text-left text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
                >
                  <Share2 className="w-4 h-4 text-[#603DC8]" />
                  <span>Share Script</span>
                </button>

                {/* 3. SIP Order */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (onBuyClick) onBuyClick();
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 text-left text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
                >
                  <Clock className="w-4 h-4 text-[#603DC8]" />
                  <span>SIP Order</span>
                </button>

                {/* 4. Add to Basket */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full px-3.5 py-2 flex items-center gap-2 text-left text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
                >
                  <ShoppingBag className="w-4 h-4 text-[#603DC8]" />
                  <span>Add to Basket</span>
                </button>

                {/* 5. Pin Scrip to Header */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsPinModalOpen(true);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 text-left text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
                >
                  <Pin className="w-4 h-4 text-[#603DC8]" />
                  <span>Pin Scrip to Header</span>
                </button>

                {/* 6. Show Option Chain */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (onOpenOptionChain) onOpenOptionChain();
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 text-left text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100"
                >
                  <ListFilter className="w-4 h-4 text-[#603DC8]" />
                  <span>Show Option Chain</span>
                </button>

                {/* 7. Gift Shares */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full px-3.5 py-2 flex items-center gap-2 text-left text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-[#603DC8]" />
                  <span>Gift Shares</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pop-up: Pin Scrip to Header Modal (matching Figma States 1 & 2: strictly rounded-none & gap-[2px]) */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md border border-gray-300 shadow-2xl rounded-none flex flex-col gap-[2px] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between rounded-none">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                Pin Scrip to Header
              </h3>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors rounded-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Scrips with Drag Handle & Radio Buttons */}
            <div className="p-3 max-h-[380px] overflow-y-auto flex flex-col gap-[2px] rounded-none">
              {headerScripList.map((scrip) => {
                const isSelected = selectedPinId === scrip.id;
                return (
                  <div
                    key={scrip.id}
                    onClick={() => setSelectedPinId(scrip.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 border transition-colors cursor-pointer rounded-none gap-[2px] ${
                      isSelected
                        ? 'border-[#FF5722]/50 bg-[#FFF8F5]'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {/* Left: Drag Handle & Scrip details */}
                    <div className="flex items-center gap-[2px]">
                      <GripVertical className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          {scrip.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase">
                          {scrip.exchange}
                        </div>
                      </div>
                    </div>

                    {/* Right: Custom Radio Circle (empty in State 1, orange inner dot in State 2) */}
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-2 border-[#FF5722]'
                          : 'border border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#FF5722]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer with Orange Save Button */}
            <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-end rounded-none gap-[2px] bg-gray-50/50">
              <button
                type="button"
                onClick={handleSavePin}
                className="bg-[#FF5722] hover:bg-[#F4511E] text-white text-xs font-bold px-7 py-2 rounded-none cursor-pointer transition-colors shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockHeader;
