import { useState } from 'react';
import { AlertTriangle, ShieldAlert, X, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

/**
 * WarningModal
 * ---------------------------------------------------------------------------
 * Figma 1:1 Implementation of the Edge/Error & Restriction Screens (Node ID: 6822:19250):
 * - Types:
 *   1. 'AMO': Markets closed, orders placed as After Market Order [AMO]
 *   2. 'SHORT_SELL_RESTRICTION': Insufficient delivery holdings, switch to Intraday
 *   3. 'MARKET_TIMING_RESTRICTION': 3:40 PM - 4:00 PM NSE allows only Delivery orders
 *   4. 'VERIFY_SELL': CDSL TPIN verification for delivery selling (Step 1 & Step 2)
 *   5. 'TRADING_HALTED': Market-wide circuit breaker or specific stock freeze
 *   6. 'PRECAUTIONARY': Volatility / ASM / GSM regulatory warnings
 */
export const WarningModal = ({
  isOpen,
  onClose,
  type = 'AMO', // 'AMO' | 'SHORT_SELL_RESTRICTION' | 'MARKET_TIMING_RESTRICTION' | 'VERIFY_SELL' | 'TRADING_HALTED' | 'PRECAUTIONARY'
  stock,
  onConfirm,
  onSwitchToIntraday,
  onSwitchToDelivery,
}) => {
  const [tpinStep, setTpinStep] = useState(1); // 1 = Enter TPIN, 2 = Enter OTP
  const [tpin, setTpin] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen) return null;

  const stockName = stock?.displayName || stock?.name || 'Selected Stock';

  const handleVerifyStep = (e) => {
    e?.preventDefault();
    if (tpinStep === 1) {
      if (!tpin) return;
      setTpinStep(2);
    } else {
      if (!otp) return;
      setIsVerified(true);
      setTimeout(() => {
        if (onConfirm) onConfirm();
        if (onClose) onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden select-none animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              type === 'AMO'
                ? 'bg-blue-50 text-blue-600'
                : type === 'VERIFY_SELL'
                ? 'bg-purple-50 text-[#603DC8]'
                : 'bg-amber-50 text-amber-600'
            }`}>
              {type === 'AMO' ? (
                <Clock className="w-4 h-4" />
              ) : type === 'VERIFY_SELL' ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                {type === 'AMO' && 'After Market Order (AMO)'}
                {type === 'SHORT_SELL_RESTRICTION' && 'Holding Restriction'}
                {type === 'MARKET_TIMING_RESTRICTION' && 'Market Timing Notice'}
                {type === 'VERIFY_SELL' && 'Verify Demat Holdings (EDIS)'}
                {type === 'TRADING_HALTED' && 'Trading Halted'}
                {type === 'PRECAUTIONARY' && 'Precautionary Message'}
              </h3>
              <span className="text-[11px] text-gray-500 font-medium">
                {stockName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body Content based on Warning Type */}
        <div className="p-5 space-y-4 text-xs">
          {/* 1. AMO Warning */}
          {type === 'AMO' && (
            <div className="space-y-3">
              <div className="bg-[#EFF8FF] border border-[#B2DDFF] rounded-xl p-3.5 text-blue-900 leading-relaxed">
                Markets are closed right now. Your order will be placed as an <strong>After Market Order [AMO]</strong> and sent to the exchange when the market opens next trading session (09:15 AM).
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    if (onClose) onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-[#FF6900] hover:bg-[#E55E00] text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Proceed with AMO
                </button>
              </div>
            </div>
          )}

          {/* 2. Short Sell Restriction */}
          {type === 'SHORT_SELL_RESTRICTION' && (
            <div className="space-y-3">
              <div className="bg-[#FFF8F0] border border-[#FEDF89] rounded-xl p-3.5 text-amber-950 leading-relaxed">
                You don’t have sufficient holdings in your Demat to sell in <strong>Delivery</strong>. Please switch to <strong>Intraday</strong> if you want to short-sell for today's session.
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSwitchToIntraday) onSwitchToIntraday();
                    if (onClose) onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-[#603DC8] hover:bg-[#502EB8] text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Switch to Intraday
                </button>
              </div>
            </div>
          )}

          {/* 3. Market Timing Restriction */}
          {type === 'MARKET_TIMING_RESTRICTION' && (
            <div className="space-y-3">
              <div className="bg-[#FFF8F0] border border-[#FEDF89] rounded-xl p-3.5 text-amber-950 leading-relaxed">
                For equity segment, from <strong>03:40 PM - 04:00 PM</strong>, NSE allows only delivery post-close orders. Please switch to <strong>Delivery</strong> order type.
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSwitchToDelivery) onSwitchToDelivery();
                    if (onClose) onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-[#039855] hover:bg-[#027A48] text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Switch to Delivery
                </button>
              </div>
            </div>
          )}

          {/* 4. CDSL TPIN / Verify Sell (EDIS) */}
          {type === 'VERIFY_SELL' && (
            <div className="space-y-3.5">
              <div className="bg-[#F9F5FF] border border-[#E9D7FE] rounded-xl p-3 text-purple-950">
                Regulatory mandate: Authorize transfer of delivery shares via CDSL TPIN before execution.
              </div>

              {tpinStep === 1 ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Enter 6-Digit CDSL TPIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="••••••"
                      value={tpin}
                      onChange={(e) => setTpin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-center tracking-widest text-base font-bold outline-none focus:border-[#603DC8]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Don't have a TPIN?</span>
                    <button type="button" className="text-[#603DC8] font-semibold hover:underline cursor-pointer">
                      Generate TPIN on CDSL
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyStep}
                      disabled={tpin.length !== 6}
                      className="px-5 py-2 rounded-xl bg-[#603DC8] disabled:bg-gray-300 text-white font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Enter OTP sent to registered Mobile & Email
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-center tracking-widest text-base font-bold outline-none focus:border-[#603DC8]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setTpinStep(1)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyStep}
                      disabled={otp.length !== 6}
                      className="px-5 py-2 rounded-xl bg-[#039855] disabled:bg-gray-300 text-white font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      {isVerified ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified!</span>
                        </>
                      ) : (
                        <span>Verify & Place Sell</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Trading Halted */}
          {type === 'TRADING_HALTED' && (
            <div className="space-y-3">
              <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-3.5 text-rose-950 leading-relaxed">
                Trading in this scrip has been halted by the exchange due to circuit breaker triggers or regulatory notifications. New orders cannot be accepted during the halt period.
              </div>
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Understood
                </button>
              </div>
            </div>
          )}

          {/* 6. Precautionary Message */}
          {type === 'PRECAUTIONARY' && (
            <div className="space-y-3">
              <div className="bg-[#FFF8F0] border border-[#FEDF89] rounded-xl p-3.5 text-amber-950 leading-relaxed">
                <strong>Precautionary Notice:</strong> This instrument is under additional surveillance measure (ASM / GSM stage). Intraday leverage is restricted, and 100% upfront cash margin is required for trade settlement.
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    if (onClose) onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-[#FF6900] hover:bg-[#E55E00] text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  I Acknowledge
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarningModal;

