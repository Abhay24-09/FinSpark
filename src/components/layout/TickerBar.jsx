import { useState, useEffect } from 'react';
import { INDICES_TICKER } from '../../data/marketData';
import { fetchIndexTickers } from '../../services/marketApi';

export const TickerBar = () => {
  const [tickerData, setTickerData] = useState(INDICES_TICKER);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTickers() {
      try {
        const result = await fetchIndexTickers();
        if (isMounted) {
          setTickerData(result.data);
          setIsLive(result.isLive);
        }
      } catch {
        if (isMounted) {
          setTickerData(INDICES_TICKER);
          setIsLive(false);
        }
      }
    }

    loadTickers();
    // Poll every 30 seconds for live quote updates
    const interval = setInterval(loadTickers, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Multi-copy set to ensure seamless width across any screen resolution
  const segmentItems = [...tickerData, ...tickerData, ...tickerData];

  return (
    <div
      style={{ height: '30px', top: '0px' }}
      className="w-full bg-ticker-bg text-ticker-text text-[11px] font-medium border-b border-ticker-border select-none overflow-hidden sticky top-0 z-[130] h-[30px] flex items-center"
    >
      <div className="w-full px-2 sm:px-3 h-full flex items-center gap-3 relative">
        {/* Live session status badge matching Figma */}
        <div className="flex items-center gap-2 shrink-0 pr-3 sm:pr-4 border-r border-emerald-900/60 z-20 bg-ticker-bg shadow-[4px_0_10px_rgba(8,27,19,0.9)]">
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-success"
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2 bg-success"
            />
          </span>
          <span className="text-gray-200 font-medium text-[11px] whitespace-nowrap">
            Market session <span className="text-emerald-400 font-semibold">Live</span>
          </span>
        </div>

        {/* Continuous Horizontal Infinite Looping Marquee */}
        <div className="flex-1 overflow-hidden relative min-w-0">
          {/* Subtle edge fade overlays */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-ticker-bg to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-ticker-bg to-transparent z-10" />

          {/* Marquee Track with 2 identical seamless segments */}
          <div className="animate-ticker-marquee flex items-center py-0.5">
            {/* Segment 1 */}
            <div className="flex items-center gap-8 shrink-0 pr-8">
              {segmentItems.map((index, idx) => (
                <div key={`track1-${index.id}-${idx}`} className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="text-gray-300 font-semibold">{index.name}</span>
                  <span className="text-white font-medium">{index.value}</span>
                  <span
                    className={`font-semibold text-[10px] ${
                      index.isPositive ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {index.change} ({index.changePercent})
                  </span>
                </div>
              ))}
            </div>

            {/* Segment 2 (Identical Twin) */}
            <div className="flex items-center gap-8 shrink-0 pr-8" aria-hidden="true">
              {segmentItems.map((index, idx) => (
                <div key={`track2-${index.id}-${idx}`} className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="text-gray-300 font-semibold">{index.name}</span>
                  <span className="text-white font-medium">{index.value}</span>
                  <span
                    className={`font-semibold text-[10px] ${
                      index.isPositive ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {index.change} ({index.changePercent})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TickerBar;
