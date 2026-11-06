import { useState } from 'react';
import TradingChart from '../TradingChart';
import FnoMovers from './FnoMovers';
import OiAnalysis from './OiAnalysis';
import ExpiringSoon from './ExpiringSoon';
import FnoExpertsPick from './FnoExpertsPick';
import OiBuildup from './OiBuildup';
import OptionChainCard from './OptionChainCard';
import KnowledgeCentre from '../dashboard/KnowledgeCentre';
import { ChevronDown, ChevronUp, LineChart } from 'lucide-react';

export const FnoLandingPage = () => {
  const [showChart, setShowChart] = useState(true);

  return (
    <div className="space-y-3">
      {/* Live Underlying Chart (Upstox v2 & Lightweight Charts) */}
      <div className="bg-card-bg rounded-xl border border-card-border p-3 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-card-border mb-2.5">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-text-main">
              Live Underlying Chart (Upstox v2)
            </h3>
            <span className="hidden sm:inline-block text-[11px] text-text-muted">
              Nifty 50 • Bank Nifty • Sensex
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            <span>{showChart ? 'Collapse Chart' : 'Expand Chart'}</span>
            {showChart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showChart && (
          <TradingChart
            instrumentKey="NSE_INDEX|Nifty 50"
            interval="day"
            height={360}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-3 items-start">
        {/* Left Column: FnO Movers (55% Width) */}
        <section className="space-y-3 min-w-0">
          <FnoMovers />
        </section>

        {/* Right Column: Derivatives Analytics & Picks (45% Width) */}
        <section className="space-y-3 min-w-0">
          {/* 1. OI Analysis with Bar Chart */}
          <OiAnalysis />

          {/* 2. Expiring Soon (Futures / Options) */}
          <ExpiringSoon />

          {/* 3. Expert's Pick with BUY & SELL Calls */}
          <FnoExpertsPick />

          {/* 4. OI Buildup (Bullish / Bearish) */}
          <OiBuildup />

          {/* 5. Option Chain with Strikes, PCR & Spot Price */}
          <OptionChainCard />

          {/* 6. Knowledge Centre Educational Cards */}
          <KnowledgeCentre />
        </section>
      </div>
    </div>
  );
};

export default FnoLandingPage;
