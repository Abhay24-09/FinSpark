import { useState, useEffect, useRef } from 'react';
import {
  SlidersHorizontal,
  Info,
  Check,
  X,
  Maximize2,
  Minimize2,
  ArrowUpDown,
  AlertCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import WarningModal from '../common/WarningModal';

/**
 * Unified Right Order Panel (Figma 1:1 Match - Node ID: 6496:10290 / 6760:21099)
 * ---------------------------------------------------------------------------
 * Matches the exact Figma prototype design:
 * 1. Docked to the right side (390-410px wide) with NO dark backdrop over the chart.
 * 2. Clean modern order form:
 *    - Segmented Order Types: Market (Orange active pill) | Limit | Trigger
 *    - Market Depth toggle button on top-right (expands 5-level Bid/Ask book)
 *    - Quantity card: Soft lavender badge [Quantity] on left, bold number on right
 *    - Price card: Soft lavender badges [Price] [Auto] on left, "At Market" on right
 *    - Pay Later (MTF) card: Lavender background (#ECEBFE), checkbox, 1x Margin price
 *    - Adjust Validity & Disclose Qty card (#F5F6F8) with iOS toggle switch
 *    - Stop-Loss /Target card (#F5F6F8) with iOS toggle switch
 *    - Pinned footer bar: Balance, Required margin (with dotted underline), and Buy/Sell button
 * 3. Warning Modals matching Figma Node 6822:19250:
 *    - Short Selling Restriction (Delivery sell without holdings -> Switch to Intraday)
 *    - CDSL TPIN Demat Sell Verification (Step 1 TPIN -> Step 2 OTP)
 *    - AMO Warning Notice (After Market Order outside hours)
 */
const FIGMA_DEFAULT_BIDS = [
  { price: 159.61, orders: 12, quantity: 2250268 },
  { price: 159.30, orders: 12, quantity: 4858988 },
  { price: 159.12, orders: 12, quantity: 2050348 },
  { price: 158.60, orders: 12, quantity: 1528447 },
  { price: 158.55, orders: 12, quantity: 4838813 },
];

const FIGMA_DEFAULT_ASKS = [
  { price: 159.67, orders: 123, quantity: 2250268 },
  { price: 159.46, orders: 123, quantity: 4858988 },
  { price: 159.27, orders: 123, quantity: 2050348 },
  { price: 158.12, orders: 123, quantity: 1528447 },
  { price: 158.09, orders: 123, quantity: 4838813 },
];

export const RightOrderPanel = ({
  stock,
  action: initialAction = 'BUY',
  initialViewMode = 'sidebar', // 'sidebar' | 'overlay'
  initialProductType = 'Long-term', // 'Long-term' | 'Intraday' | 'Pay Later'
  initialQuantity = '12',
  onClose,
  onSubmitOrder,
}) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [action, setAction] = useState(initialAction); // 'BUY' | 'SELL'
  const [productType, setProductType] = useState(initialProductType); // 'Long-term' | 'Intraday' | 'Pay Later'
  const [orderType, setOrderType] = useState('Market'); // 'Market' | 'Limit' | 'Trigger'
  const [exchange, setExchange] = useState(stock?.exchange === 'BSE' ? 'BSE' : 'NSE');
  const [isDepthOpen, setIsDepthOpen] = useState(false); // Market Depth toggle

  const bids = (stock?.bids && stock.bids.length > 0) ? stock.bids : FIGMA_DEFAULT_BIDS;
  const asks = (stock?.asks && stock.asks.length > 0) ? stock.asks : FIGMA_DEFAULT_ASKS;
  const totalBuyQty = stock?.totalBuyQuantity || 33275045;
  const totalSellQty = stock?.totalSellQuantity || 57875307;

  // Live price calculation
  const baseLtp = typeof stock?.lastTradedPrice === 'number'
    ? stock.lastTradedPrice
    : (typeof stock?.price === 'number'
      ? stock.price
      : (typeof stock?.ltp === 'number'
        ? stock.ltp
        : (stock?.price ? parseFloat(String(stock.price).replace(/[^0-9.-]/g, '')) : 67.54)));

  const nsePrice = typeof stock?.lastTradedPrice === 'number' && stock.exchange !== 'BSE'
    ? stock.lastTradedPrice
    : (typeof stock?.nsePrice === 'number' ? stock.nsePrice : baseLtp);

  const bsePrice = typeof stock?.bsePrice === 'number'
    ? stock.bsePrice
    : (stock?.exchange === 'BSE' && typeof stock?.lastTradedPrice === 'number'
      ? stock.lastTradedPrice
      : Number((baseLtp * 0.9985).toFixed(2)));

  const currentPrice = exchange === 'BSE' ? bsePrice : nsePrice;

  // Input States
  const [quantity, setQuantity] = useState(initialQuantity || '12');
  const [limitPrice, setLimitPrice] = useState(currentPrice.toFixed(2));
  const [triggerPrice, setTriggerPrice] = useState(Number((currentPrice * 0.99).toFixed(2)).toString());
  const [isPayLater, setIsPayLater] = useState(initialProductType === 'Pay Later');
  const [isPriceAuto, setIsPriceAuto] = useState(true);

  // Toggle & Expansion States
  const [isValidityOpen, setIsValidityOpen] = useState(false);
  const [validity, setValidity] = useState('DAY'); // 'DAY' | 'IOC'
  const [disclosedQty, setDisclosedQty] = useState('');

  const [isStopLossOpen, setIsStopLossOpen] = useState(false);
  const [stopLossValue, setStopLossValue] = useState('');
  const [targetValue, setTargetValue] = useState('');

  const [isGttOpen, setIsGttOpen] = useState(false);
  const [gttTriggerValue, setGttTriggerValue] = useState('');

  const [isOrderExecuted, setIsOrderExecuted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Warning Modal States (Figma Node 6822:19250)
  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    type: 'AMO', // 'AMO' | 'SHORT_SELL_RESTRICTION' | 'VERIFY_SELL'
  });

  const availableHoldings = stock?.holdingQty ?? stock?.holdings ?? 0;
  const panelRef = useRef(null);

  // Sync action and product type if incoming props change
  useEffect(() => {
    setAction(initialAction);
    if (initialAction === 'SELL' && productType === 'Pay Later') {
      setProductType('Long-term');
      setIsPayLater(false);
    }
  }, [initialAction]);

  useEffect(() => {
    setProductType(initialProductType);
    if (initialProductType === 'Pay Later') {
      setIsPayLater(true);
    }
  }, [initialProductType]);

  // Sync limit and trigger prices whenever currentPrice changes
  useEffect(() => {
    setLimitPrice(currentPrice.toFixed(2));
    setTriggerPrice(Number((currentPrice * 0.99).toFixed(2)).toString());
  }, [currentPrice]);

  // Sync exchange whenever stock exchange changes
  useEffect(() => {
    if (stock?.exchange && (stock.exchange === 'NSE' || stock.exchange === 'BSE')) {
      setExchange(stock.exchange);
    }
  }, [stock?.exchange]);

  // Input element refs for precise caret positioning
  const marketQuantityInputRef = useRef(null);
  const limitQuantityInputRef = useRef(null);
  const triggerQuantityInputRef = useRef(null);
  const marketPriceInputRef = useRef(null);
  const limitPriceInputRef = useRef(null);
  const triggerPriceInputRef = useRef(null);
  const triggerLimitPriceInputRef = useRef(null);
  const discloseQtyInputRef = useRef(null);

  const placeCursorAtEnd = (el) => {
    if (!el) return;
    const len = el.value !== undefined && el.value !== null ? String(el.value).length : 0;
    try {
      el.setSelectionRange(len, len);
    } catch (_) {}
  };

  // Quantity handlers
  const handleQuantityChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val === '') {
      setQuantity('');
    } else {
      const num = parseInt(val, 10);
      setQuantity(Math.max(0, num));
    }
  };

  const handleQuantityBlur = () => {
    if (quantity === '' || isNaN(Number(quantity)) || Number(quantity) < 0) {
      setQuantity('1');
    }
  };

  const handleQuantityKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setQuantity((prev) => (Number(prev) || 0) + 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setQuantity((prev) => Math.max(0, (Number(prev) || 0) - 1));
    }
  };

  // Price handlers
  const handlePriceChange = (setter) => (e) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    setter(val);
  };

  const handlePriceBlur = (value, setter, fallback) => () => {
    if (value === '' || isNaN(parseFloat(value)) || parseFloat(value) < 0) {
      setter(Number(fallback).toFixed(2));
    } else {
      setter(parseFloat(value).toFixed(2));
    }
  };

  const handlePriceKeyDown = (setter, step = 0.05) => (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setter((prev) => (Math.max(0, (parseFloat(prev) || 0) + step)).toFixed(2));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setter((prev) => (Math.max(0, (parseFloat(prev) || 0) - step)).toFixed(2));
    }
  };

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 200);
  };

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isBuy = action === 'BUY';
  const effectivePrice = (orderType === 'Market' && isPriceAuto)
    ? currentPrice
    : (parseFloat(limitPrice) || currentPrice);

  // Financial calculations
  const totalValue = Number((effectivePrice * (Number(quantity) || 0)).toFixed(2));
  const leverageMultiplier = !isBuy
    ? (productType === 'Intraday' ? 0.2 : 0)
    : (productType === 'Intraday' ? 0.2 : (isPayLater || productType === 'Pay Later' ? 0.25 : 1.0));
  const requiredFunds = (totalValue * leverageMultiplier).toFixed(2);
  const payLaterPrice = (totalValue * 0.25).toFixed(2);
  const userBalance = '2021.24';

  // Order Submission with Figma Edge/Error Checks
  const executeOrderSubmission = () => {
    const numQty = Number(quantity) || 1;
    const newOrder = {
      id: `ord_${Date.now()}`,
      symbol: stock?.tradingSymbol || stock?.symbol || 'RPOWER-EQ',
      displayName: stock?.displayName || stock?.name || 'Reliance Power',
      exchange,
      action,
      orderType: (orderType === 'Market' && !isPriceAuto) ? 'LIMIT' : orderType.toUpperCase(),
      productType: (isPayLater || productType === 'Pay Later') ? 'PAY_LATER (MTF)' : productType.toUpperCase(),
      qty: numQty,
      price: Number(effectivePrice).toFixed(2),
      status: 'Executed',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      unitPrice: Number(effectivePrice).toFixed(2),
      orderValue: Number((effectivePrice * numQty).toFixed(2)),
      disclosedQty: isValidityOpen && disclosedQty ? Number(disclosedQty) : undefined,
      validity: isValidityOpen ? validity : 'DAY',
      stopLoss: isStopLossOpen && stopLossValue ? Number(stopLossValue) : undefined,
      target: isStopLossOpen && targetValue ? Number(targetValue) : undefined,
    };

    if (onSubmitOrder) {
      onSubmitOrder(newOrder);
    }

    setIsOrderExecuted(true);
    setTimeout(() => {
      setIsOrderExecuted(false);
      handleClose();
    }, 600);
  };

  const handleExecute = (e) => {
    e?.preventDefault();
    if (quantity === '' || isNaN(Number(quantity)) || Number(quantity) <= 0) return;

    // 1. Delivery Sell without sufficient Demat holdings -> Trigger Figma Short Sell Restriction
    if (!isBuy && productType === 'Long-term') {
      if (availableHoldings <= 0) {
        setWarningModal({
          isOpen: true,
          type: 'SHORT_SELL_RESTRICTION',
        });
        return;
      }
      // If user holds shares, prompt CDSL TPIN verification for Demat authorization
      setWarningModal({
        isOpen: true,
        type: 'VERIFY_SELL',
      });
      return;
    }

    executeOrderSubmission();
  };

  // Form body matching exact Figma layout
  const renderFormContent = () => (
    <div className="flex flex-col h-full bg-white select-none font-['Poppins',sans-serif] relative">
      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5 no-scrollbar">
        {/* ========================================================================= */}
        {/* TOP CONTAINER: Segmented Order Types, Quantity Card, Price Card (#F5F6F8)  */}
        {/* ========================================================================= */}
        <div className="bg-[#F5F6F8] rounded-2xl p-2.5 sm:p-3 space-y-2.5">
          {/* Row 0: Market | Limit | Trigger Pill + Market Depth Toggle + Close X */}
          <div className="flex items-center justify-between gap-2">
            {/* Segmented Pill Selector (Market Orange pill, white text) */}
            <div className="bg-white p-1 rounded-full flex items-center gap-0.5 shadow-2xs">
              {['Market', 'Limit', 'Trigger'].map((type) => {
                const isActive = orderType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setOrderType(type);
                      setIsValidityOpen(false);
                      if (type === 'Market') setIsPriceAuto(true);
                    }}
                    className={`text-xs px-3.5 sm:px-4 py-1.5 rounded-full cursor-pointer transition-all select-none ${
                      isActive
                        ? 'bg-[#FF7A00] text-white font-medium shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900 font-normal'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            {/* Right Controls: Market Depth Toggle Button + Close X */}
            <div className="flex items-center gap-1.5">
              {/* Market Depth Equalizer Pill Button matching Figma Image 2 */}
              <button
                type="button"
                onClick={() => setIsDepthOpen((prev) => !prev)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                  isDepthOpen
                    ? 'border-[#FF7A00] bg-[#FF7A00] text-white'
                    : 'border-gray-200/90 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title={isDepthOpen ? 'Hide Market Depth' : 'Show Market Depth'}
                aria-label="Toggle Market Depth"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>

              {/* Close Button */}
              {onClose && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-7 h-7 rounded-full bg-white border border-gray-200/80 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
                  title="Close (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Market Depth 5-Level Table (Expands smoothly when toggled) */}
          {isDepthOpen && (
            <div className="bg-white rounded-xl p-2.5 space-y-1.5 shadow-2xs border border-gray-100 animate-in fade-in duration-150 text-[11px]">
              <div className="grid grid-cols-2 gap-2 font-semibold text-gray-500 px-1 border-b border-gray-100 pb-1">
                <div className="grid grid-cols-3">
                  <span>Bid</span>
                  <span className="text-center">Orders</span>
                  <span className="text-right">Qty</span>
                </div>
                <div className="grid grid-cols-3">
                  <span>Ask</span>
                  <span className="text-center">Orders</span>
                  <span className="text-right">Qty</span>
                </div>
              </div>

              {bids.map((bid, i) => {
                const ask = asks[i] || { price: 0, orders: 0, quantity: 0 };
                return (
                  <div key={`depth-${i}`} className="grid grid-cols-2 gap-2 px-1 py-0.5 items-center font-medium">
                    <div
                      onClick={() => {
                        setLimitPrice(bid.price.toFixed(2));
                        if (orderType === 'Market') setOrderType('Limit');
                        setIsPriceAuto(false);
                      }}
                      className="grid grid-cols-3 cursor-pointer hover:bg-green-50 rounded px-0.5 transition-colors"
                    >
                      <span className="text-[#00BE5C]">{bid.price.toFixed(2)}</span>
                      <span className="text-center text-gray-600">{bid.orders}</span>
                      <span className="text-right text-[#00BE5C]">{bid.quantity.toLocaleString('en-IN')}</span>
                    </div>
                    <div
                      onClick={() => {
                        setLimitPrice(ask.price.toFixed(2));
                        if (orderType === 'Market') setOrderType('Limit');
                        setIsPriceAuto(false);
                      }}
                      className="grid grid-cols-3 cursor-pointer hover:bg-red-50 rounded px-0.5 transition-colors"
                    >
                      <span className="text-[#F72F53]">{ask.price.toFixed(2)}</span>
                      <span className="text-center text-gray-600">{ask.orders}</span>
                      <span className="text-right text-[#F72F53]">{ask.quantity.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-[10px] text-gray-500 font-semibold px-1">
                <div className="flex justify-between">
                  <span>Bid Total</span>
                  <span className="text-gray-900">{totalBuyQty.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ask Total</span>
                  <span className="text-gray-900">{totalSellQty.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Trigger Order Variant */}
          {orderType === 'Trigger' && (
            <div
              onClick={() => {
                if (triggerPriceInputRef.current) {
                  triggerPriceInputRef.current.focus();
                  placeCursorAtEnd(triggerPriceInputRef.current);
                }
              }}
              className="bg-white rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
            >
              <span className="bg-[#EEEDFC] text-[#2A2B35] text-xs font-semibold px-3 py-1 rounded-full select-none">
                Trigger ₹
              </span>
              <input
                ref={triggerPriceInputRef}
                type="text"
                inputMode="decimal"
                value={triggerPrice}
                onChange={handlePriceChange(setTriggerPrice)}
                onBlur={handlePriceBlur(triggerPrice, setTriggerPrice, currentPrice * 0.99)}
                onKeyDown={handlePriceKeyDown(setTriggerPrice)}
                onClick={(e) => e.stopPropagation()}
                className="w-28 text-right font-bold text-gray-900 text-base sm:text-lg outline-none bg-transparent cursor-text"
              />
            </div>
          )}

          {/* Quantity Card (Figma 1:1 Match) */}
          <div
            onClick={() => {
              const ref = orderType === 'Trigger' ? triggerQuantityInputRef : (orderType === 'Limit' ? limitQuantityInputRef : marketQuantityInputRef);
              if (ref.current) {
                ref.current.focus();
                placeCursorAtEnd(ref.current);
              }
            }}
            className="bg-white rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
          >
            <span className="bg-[#EEEDFC] text-[#2A2B35] text-xs font-semibold px-3 py-1 rounded-full select-none">
              Quantity
            </span>
            <input
              ref={orderType === 'Trigger' ? triggerQuantityInputRef : (orderType === 'Limit' ? limitQuantityInputRef : marketQuantityInputRef)}
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              onKeyDown={handleQuantityKeyDown}
              onClick={(e) => e.stopPropagation()}
              placeholder="12"
              className="w-28 text-right font-bold text-gray-900 text-base sm:text-lg outline-none bg-transparent cursor-text placeholder:text-gray-400"
            />
          </div>

          {/* Price Card (Figma 1:1 Match) */}
          {orderType === 'Market' && (
            <div
              onClick={() => {
                if (isPriceAuto) {
                  setIsPriceAuto(false);
                } else if (marketPriceInputRef.current) {
                  marketPriceInputRef.current.focus();
                  placeCursorAtEnd(marketPriceInputRef.current);
                }
              }}
              className="bg-white rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-1.5 select-none">
                <span className="bg-[#EEEDFC] text-[#2A2B35] text-xs font-semibold px-3 py-1 rounded-full">
                  Price
                </span>
                <span className="bg-[#EEEDFC] text-[#603DC8] text-xs font-semibold px-2.5 py-1 rounded-full">
                  Auto
                </span>
              </div>

              {isPriceAuto ? (
                <span className="text-sm font-normal text-gray-400 select-none">
                  At Market
                </span>
              ) : (
                <input
                  ref={marketPriceInputRef}
                  type="text"
                  inputMode="decimal"
                  value={limitPrice}
                  onChange={handlePriceChange(setLimitPrice)}
                  onBlur={handlePriceBlur(limitPrice, setLimitPrice, currentPrice)}
                  onKeyDown={handlePriceKeyDown(setLimitPrice)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={currentPrice.toFixed(2)}
                  className="w-28 text-right font-bold text-gray-900 text-base sm:text-lg outline-none bg-transparent cursor-text"
                  autoFocus
                />
              )}
            </div>
          )}

          {/* Price Card for Limit */}
          {orderType === 'Limit' && (
            <div
              onClick={() => {
                if (limitPriceInputRef.current) {
                  limitPriceInputRef.current.focus();
                  placeCursorAtEnd(limitPriceInputRef.current);
                }
              }}
              className="bg-white rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
            >
              <span className="bg-[#EEEDFC] text-[#2A2B35] text-xs font-semibold px-3 py-1 rounded-full select-none">
                Price
              </span>
              <input
                ref={limitPriceInputRef}
                type="text"
                inputMode="decimal"
                value={limitPrice}
                onChange={handlePriceChange(setLimitPrice)}
                onBlur={handlePriceBlur(limitPrice, setLimitPrice, currentPrice)}
                onKeyDown={handlePriceKeyDown(setLimitPrice)}
                onClick={(e) => e.stopPropagation()}
                className="w-28 text-right font-bold text-gray-900 text-base sm:text-lg outline-none bg-transparent cursor-text"
              />
            </div>
          )}

          {/* Price Card for Trigger */}
          {orderType === 'Trigger' && (
            <div
              onClick={() => {
                if (triggerLimitPriceInputRef.current) {
                  triggerLimitPriceInputRef.current.focus();
                  placeCursorAtEnd(triggerLimitPriceInputRef.current);
                }
              }}
              className="bg-white rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
            >
              <span className="bg-[#EEEDFC] text-[#2A2B35] text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 select-none">
                <span>Price</span>
                <span className="text-[#FF7A00] flex items-center gap-0.5">
                  Limit <ArrowUpDown className="w-2.5 h-2.5 inline" />
                </span>
              </span>
              <input
                ref={triggerLimitPriceInputRef}
                type="text"
                inputMode="decimal"
                value={limitPrice}
                onChange={handlePriceChange(setLimitPrice)}
                onBlur={handlePriceBlur(limitPrice, setLimitPrice, currentPrice)}
                onKeyDown={handlePriceKeyDown(setLimitPrice)}
                onClick={(e) => e.stopPropagation()}
                className="w-28 text-right font-bold text-gray-900 text-base sm:text-lg outline-none bg-transparent cursor-text"
              />
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ROW 1: 1x Margin with Pay Later Card (#ECEBFE)                           */}
        {/* ========================================================================= */}
        {isBuy && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              setIsPayLater((prev) => {
                const next = !prev;
                setProductType(next ? 'Pay Later' : 'Long-term');
                return next;
              });
            }}
            className="bg-[#ECEBFE] rounded-xl px-3.5 py-3 flex items-center gap-2.5 cursor-pointer select-none transition-all hover:bg-[#E5E3FE]"
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                isPayLater
                  ? 'border-[#603DC8] bg-[#603DC8] text-white'
                  : 'border-gray-300 bg-white text-transparent'
              }`}
            >
              {isPayLater && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
            </div>
            <span className="text-xs sm:text-sm text-gray-800 leading-tight">
              <span className="text-[#603DC8] font-bold mr-1">1x</span>
              Margin with Pay Later: New Price:{' '}
              <span className="text-gray-900 font-bold">
                ₹{Number(payLaterPrice) > 0 ? payLaterPrice : '1311.30'}
              </span>
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROW 2: Adjust Validity & Disclose Qty Card (#F5F6F8)                      */}
        {/* ========================================================================= */}
        <div className="bg-[#F5F6F8] rounded-xl px-3.5 py-3 space-y-2.5 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-800">
              <span>Adjust Validity &amp; Disclose Qty</span>
              <Info className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
            </div>

            {/* iOS-Style Toggle Switch (OFF: #D1D1D6, ON: #FF7A00) */}
            <button
              type="button"
              onClick={() => setIsValidityOpen((prev) => !prev)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isValidityOpen ? 'bg-[#FF7A00]' : 'bg-[#D1D1D6]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  isValidityOpen ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isValidityOpen && (
            <div className="space-y-2.5 pt-1 animate-in fade-in duration-150 border-t border-gray-200/60 mt-2">
              {/* Day / IOC Pill */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Validity</span>
                <div className="bg-white p-0.5 rounded-full flex items-center border border-gray-100 shadow-2xs">
                  {['DAY', 'IOC'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValidity(v)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        validity === v
                          ? 'bg-[#FF7A00] text-white shadow-2xs'
                          : 'text-[#FF7A00] hover:text-[#e06c00]'
                      }`}
                    >
                      {v === 'DAY' ? 'Day' : 'IOC'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disclose Qty Card */}
              <div
                onClick={() => {
                  if (discloseQtyInputRef.current) {
                    discloseQtyInputRef.current.focus();
                    placeCursorAtEnd(discloseQtyInputRef.current);
                  }
                }}
                className="bg-white rounded-xl px-3 py-2 flex items-center justify-between shadow-2xs cursor-pointer"
              >
                <span className="bg-[#EEEDFC] text-[#2A2B35] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Disclose Qty.
                </span>
                <input
                  ref={discloseQtyInputRef}
                  type="text"
                  inputMode="numeric"
                  value={disclosedQty}
                  onChange={(e) => setDisclosedQty(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-24 text-right font-bold text-gray-900 text-sm outline-none bg-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ROW 3: Stop-Loss /Target Card (#F5F6F8)                                   */}
        {/* ========================================================================= */}
        <div className="bg-[#F5F6F8] rounded-xl px-3.5 py-3 space-y-2.5 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-800">
              <span>Stop-Loss /Target</span>
              <Info className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
            </div>

            {/* iOS-Style Toggle Switch (OFF: #D1D1D6, ON: #FF7A00) */}
            <button
              type="button"
              onClick={() => setIsStopLossOpen((prev) => !prev)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isStopLossOpen ? 'bg-[#FF7A00]' : 'bg-[#D1D1D6]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  isStopLossOpen ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isStopLossOpen && (
            <div className="pt-2 border-t border-gray-200/60 grid grid-cols-2 gap-2 animate-in fade-in duration-100 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 font-semibold block mb-1">Stop-Loss (₹)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Trigger"
                  value={stopLossValue}
                  onChange={handlePriceChange(setStopLossValue)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs outline-none font-semibold text-right"
                />
              </div>

              <div>
                <span className="text-[10px] text-gray-500 font-semibold block mb-1">Target (₹)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Target"
                  value={targetValue}
                  onChange={handlePriceChange(setTargetValue)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs outline-none font-semibold text-right"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PINNED STICKY FOOTER (Balance, Required, Green Buy / Red Sell Button)   */}
      {/* ========================================================================= */}
      <div className="border-t border-gray-100 bg-white px-4 py-3.5 flex items-center justify-between gap-3">
        {/* Balance & Required Stats matching Figma Image 2 */}
        <div className="flex items-center gap-5 sm:gap-6 text-xs">
          <div>
            <span className="text-[11px] text-gray-500 font-normal block leading-tight">
              Balance :
            </span>
            <span className="font-bold text-gray-900 text-xs sm:text-sm">
              ₹{userBalance}
            </span>
          </div>

          <div>
            <span
              className="text-[11px] text-gray-500 font-normal block underline decoration-dotted cursor-help leading-tight"
              title="Required margin to execute order"
            >
              Required :
            </span>
            <span className="font-bold text-gray-900 text-xs sm:text-sm">
              ₹{requiredFunds}
            </span>
          </div>
        </div>

        {/* Action Button: Green Buy (#00C06A) / Red Sell (#F72F53) */}
        <button
          type="button"
          onClick={handleExecute}
          className={`font-semibold text-sm sm:text-base px-8 sm:px-9 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 text-white ${
            isOrderExecuted
              ? 'bg-gray-800'
              : isBuy
              ? 'bg-[#00C06A] hover:bg-[#05B169]'
              : 'bg-[#F72F53] hover:bg-[#E02647]'
          }`}
        >
          {isOrderExecuted ? '✓ Executed' : isBuy ? 'Buy' : 'Sell'}
        </button>
      </div>

      {/* Figma 1:1 Edge/Error & Restriction Modals (Node 6822:19250) */}
      <WarningModal
        isOpen={warningModal.isOpen}
        type={warningModal.type}
        stock={stock}
        onClose={() => setWarningModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          setWarningModal((prev) => ({ ...prev, isOpen: false }));
          executeOrderSubmission();
        }}
        onSwitchToIntraday={() => {
          setProductType('Intraday');
          setWarningModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );

  // 1. Overlay (Modal) Mode if explicitly requested
  if (viewMode === 'overlay') {
    return (
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
        style={{ top: '32px', height: 'calc(100vh - 32px)' }}
        className={`fixed inset-x-0 bottom-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 ${
          isClosing ? 'animate-fade-out-backdrop' : 'animate-fade-in-backdrop'
        }`}
      >
        <div
          ref={panelRef}
          style={{ maxHeight: 'calc(92vh - 32px)' }}
          className={`bg-white w-full max-w-[410px] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col transition-all duration-200 ${
            isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {renderFormContent()}
        </div>
      </div>
    );
  }

  // 2. Sidebar Mode (NO dark backdrop over chart; clean drawer docked to right edge)
  return (
    <div
      ref={panelRef}
      style={{ top: '32px', height: 'calc(100vh - 32px)' }}
      className={`fixed right-0 bottom-0 w-full sm:w-[390px] md:w-[410px] bg-white border-l border-gray-200/90 shadow-[-6px_0_20px_rgba(0,0,0,0.06)] z-[110] flex flex-col ${
        isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
      }`}
    >
      {renderFormContent()}
    </div>
  );
};

export default RightOrderPanel;
