import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchOptionChainData,
  UpstoxOptionChainItem,
  getUpstoxToken,
} from '../services/marketApi';
import ApiStatusBadge from './common/ApiStatusBadge';
import {
  Layers,
  Key,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Info,
} from 'lucide-react';

export interface OptionsDataViewerProps {
  defaultInstrument?: string;
  defaultExpiry?: string;
  className?: string;
  onSelectStrike?: (strike: number, type: 'CE' | 'PE') => void;
}

const INDEX_CHOICES = [
  { key: 'NSE_INDEX|Nifty 50', label: 'NIFTY 50' },
  { key: 'NSE_INDEX|Nifty Bank', label: 'BANK NIFTY' },
  { key: 'NSE_INDEX|FINNIFTY', label: 'FINNIFTY' },
  { key: 'BSE_INDEX|SENSEX', label: 'SENSEX' },
];

const AVAILABLE_EXPIRIES = [
  '2025-09-16',
  '2025-09-23',
  '2025-09-30',
  '2025-10-07',
  '2025-10-14',
  '2025-10-28',
];

export const OptionsDataViewer: React.FC<OptionsDataViewerProps> = ({
  defaultInstrument = 'NSE_INDEX|Nifty 50',
  defaultExpiry = '2025-09-16',
  className = '',
  onSelectStrike,
}) => {
  const [selectedInstrument, setSelectedInstrument] = useState<string>(defaultInstrument);
  const [selectedExpiry, setSelectedExpiry] = useState<string>(defaultExpiry);
  const [bearerToken, setBearerToken] = useState<string>(() => {
    return getUpstoxToken();
  });
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);
  const [chainData, setChainData] = useState<UpstoxOptionChainItem[]>([]);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewGreeks, setViewGreeks] = useState<boolean>(false);

  const loadChain = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchOptionChainData(
        selectedInstrument,
        selectedExpiry,
        bearerToken.trim() || undefined
      );
      if (result.raw && result.raw.length > 0) {
        setChainData(result.raw);
      }
      setIsLive(result.isLive);
      if (result.error && !result.isLive) {
        setError(result.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching option chain';
      setError(msg);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedInstrument, selectedExpiry, bearerToken]);

  useEffect(() => {
    loadChain();
  }, [loadChain]);

  const handleSaveToken = (val: string) => {
    setBearerToken(val);
    localStorage.setItem('upstox_bearer_token', val);
  };

  const spotPrice = chainData[0]?.underlying_spot_price || 24350;
  const pcr = chainData[0]?.pcr || 0.98;

  return (
    <div
      className={`bg-card-bg rounded-xl border border-card-border shadow-xs overflow-hidden flex flex-col ${className}`}
    >
      {/* Top Controls Header */}
      <div className="p-4 border-b border-card-border flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Instrument selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text-main">Option Chain Viewer</h3>
          </div>

          {/* Instrument Selector */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
            {INDEX_CHOICES.map((idx) => (
              <button
                key={idx.key}
                type="button"
                onClick={() => setSelectedInstrument(idx.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedInstrument === idx.key
                    ? 'bg-card-bg text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {idx.label}
              </button>
            ))}
          </div>

          {/* Expiry Selector */}
          <div className="relative inline-block">
            <select
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              className="bg-gray-100 border border-gray-200 text-text-main text-xs font-semibold rounded-lg px-2.5 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {AVAILABLE_EXPIRIES.map((exp) => (
                <option key={exp} value={exp}>
                  Expiry: {exp}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Right: Greeks Toggle, Status, Upstox Token, Refresh */}
        <div className="flex items-center gap-2">
          {/* Subtle Live / Mock Mode Status Badge */}
          <ApiStatusBadge isLive={isLive} />

          {/* Greeks Toggle */}
          <button
            type="button"
            onClick={() => setViewGreeks(!viewGreeks)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              viewGreeks
                ? 'bg-primary-light text-primary border-primary/30'
                : 'bg-gray-50 text-text-muted border-gray-200 hover:text-text-main'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Greeks {viewGreeks ? 'ON' : 'OFF'}</span>
          </button>

          {/* Upstox Bearer Token Button */}
          <button
            type="button"
            onClick={() => setShowTokenInput(!showTokenInput)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              bearerToken
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-50 text-text-muted border-gray-200 hover:text-text-main'
            }`}
            title="Configure Upstox Bearer Token"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{bearerToken ? 'Token Active' : 'API Token'}</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={loadChain}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-gray-200 text-text-muted hover:text-text-main hover:bg-gray-50 cursor-pointer transition-colors"
            title="Refresh Option Chain"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Upstox Token Input Drawer */}
      {showTokenInput && (
        <div className="p-3 bg-amber-50/70 border-b border-amber-200/70 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 max-w-xl w-full">
            <span className="font-semibold text-amber-900 shrink-0">Upstox Bearer Token:</span>
            <input
              type="password"
              placeholder="Paste Upstox v2 Bearer Token (optional for live account data)"
              value={bearerToken}
              onChange={(e) => handleSaveToken(e.target.value)}
              className="flex-1 px-3 py-1 bg-white border border-amber-300 rounded-md text-xs font-mono text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <span className="text-[11px] text-amber-700">
            Saved securely in browser local storage for Upstox API v2 calls
          </span>
        </div>
      )}

      {/* Spot Price & PCR Quick Bar */}
      <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted font-medium">Spot Price:</span>
            <span className="font-bold text-text-main font-mono text-sm">
              ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted font-medium">PCR:</span>
            <span className="font-bold text-primary font-mono">{pcr}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-amber-100 border border-amber-300 rounded-xs" />
            <span>In-The-Money (ITM)</span>
          </span>
          <span className="text-text-light">•</span>
          <span>Calls (Left) | Puts (Right)</span>
        </div>
      </div>

      {/* Options Matrix Table */}
      <div className="overflow-x-auto no-scrollbar relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <span className="text-xs text-text-muted font-medium">Loading Option Chain...</span>
          </div>
        )}

        <table className="w-full text-center border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-text-light uppercase tracking-wider font-semibold">
              {/* Call Columns */}
              {viewGreeks && <th className="py-2 px-1">IV (%)</th>}
              {viewGreeks && <th className="py-2 px-1">Delta</th>}
              <th className="py-2 px-1">OI (L)</th>
              <th className="py-2 px-1">Volume</th>
              <th className="py-2 px-1 font-bold text-primary">Call LTP</th>

              {/* Center Strike */}
              <th className="py-2 px-3 font-bold text-text-main bg-gray-100">STRIKE</th>

              {/* Put Columns */}
              <th className="py-2 px-1 font-bold text-primary">Put LTP</th>
              <th className="py-2 px-1">Volume</th>
              <th className="py-2 px-1">OI (L)</th>
              {viewGreeks && <th className="py-2 px-1">Delta</th>}
              {viewGreeks && <th className="py-2 px-1">IV (%)</th>}
            </tr>
          </thead>
          <tbody>
            {chainData.map((item) => {
              const strike = item.strike_price;
              const isCallItm = strike < spotPrice;
              const isPutItm = strike > spotPrice;
              const isAtm = Math.abs(strike - spotPrice) <= 50;

              const callData = item.call_options?.market_data;
              const callGreeks = item.call_options?.option_greeks;
              const putData = item.put_options?.market_data;
              const putGreeks = item.put_options?.option_greeks;

              return (
                <tr
                  key={strike}
                  className={`border-b border-gray-100 hover:bg-gray-100/60 transition-colors ${
                    isAtm ? 'font-bold bg-indigo-50/40' : ''
                  }`}
                >
                  {/* Call Greeks */}
                  {viewGreeks && (
                    <td className={`py-1.5 px-1 ${isCallItm ? 'bg-amber-50/70' : ''}`}>
                      {callGreeks?.iv ? `${callGreeks.iv.toFixed(1)}%` : '-'}
                    </td>
                  )}
                  {viewGreeks && (
                    <td className={`py-1.5 px-1 ${isCallItm ? 'bg-amber-50/70' : ''}`}>
                      {callGreeks?.delta ? callGreeks.delta.toFixed(2) : '-'}
                    </td>
                  )}

                  {/* Call OI */}
                  <td className={`py-1.5 px-1 font-medium ${isCallItm ? 'bg-amber-50/70' : ''}`}>
                    {callData?.oi ? (callData.oi / 100000).toFixed(2) : '-'}
                  </td>

                  {/* Call Vol */}
                  <td className={`py-1.5 px-1 text-text-muted ${isCallItm ? 'bg-amber-50/70' : ''}`}>
                    {callData?.volume ? (callData.volume / 1000).toFixed(0) + 'k' : '-'}
                  </td>

                  {/* Call LTP */}
                  <td
                    onClick={() => onSelectStrike && onSelectStrike(strike, 'CE')}
                    className={`py-1.5 px-1 font-bold cursor-pointer hover:underline text-text-main ${
                      isCallItm ? 'bg-amber-50/70' : ''
                    }`}
                  >
                    ₹{callData?.ltp ? callData.ltp.toFixed(2) : '-'}
                  </td>

                  {/* STRIKE PRICE CENTER */}
                  <td
                    className={`py-1.5 px-3 font-bold whitespace-nowrap ${
                      isAtm
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-gray-100/90 text-text-main'
                    }`}
                  >
                    {strike.toLocaleString('en-IN')}
                    {isAtm && <span className="ml-1 text-[9px] font-normal uppercase">(ATM)</span>}
                  </td>

                  {/* Put LTP */}
                  <td
                    onClick={() => onSelectStrike && onSelectStrike(strike, 'PE')}
                    className={`py-1.5 px-1 font-bold cursor-pointer hover:underline text-text-main ${
                      isPutItm ? 'bg-amber-50/70' : ''
                    }`}
                  >
                    ₹{putData?.ltp ? putData.ltp.toFixed(2) : '-'}
                  </td>

                  {/* Put Vol */}
                  <td className={`py-1.5 px-1 text-text-muted ${isPutItm ? 'bg-amber-50/70' : ''}`}>
                    {putData?.volume ? (putData.volume / 1000).toFixed(0) + 'k' : '-'}
                  </td>

                  {/* Put OI */}
                  <td className={`py-1.5 px-1 font-medium ${isPutItm ? 'bg-amber-50/70' : ''}`}>
                    {putData?.oi ? (putData.oi / 100000).toFixed(2) : '-'}
                  </td>

                  {/* Put Greeks */}
                  {viewGreeks && (
                    <td className={`py-1.5 px-1 ${isPutItm ? 'bg-amber-50/70' : ''}`}>
                      {putGreeks?.delta ? putGreeks.delta.toFixed(2) : '-'}
                    </td>
                  )}
                  {viewGreeks && (
                    <td className={`py-1.5 px-1 ${isPutItm ? 'bg-amber-50/70' : ''}`}>
                      {putGreeks?.iv ? `${putGreeks.iv.toFixed(1)}%` : '-'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OptionsDataViewer;

