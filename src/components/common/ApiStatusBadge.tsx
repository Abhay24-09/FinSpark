import React from 'react';

export interface ApiStatusBadgeProps {
  isLive: boolean;
  source?: 'upstox_api' | 'mock_fallback';
  className?: string;
  showTooltip?: boolean;
}

export const ApiStatusBadge: React.FC<ApiStatusBadgeProps> = ({
  isLive,
  className = '',
}) => {
  if (isLive) {
    return (
      <span
        title="Connected to live Upstox API v2 feed"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 select-none ${className}`}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        <span>Live (Upstox API)</span>
      </span>
    );
  }

  return (
    <span
      title="Using fallback mock data (Market closed, offline, or token not configured)"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 border border-amber-500/20 select-none ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      <span>Demo / Mock Mode</span>
    </span>
  );
};

export default ApiStatusBadge;

