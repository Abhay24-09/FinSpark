import MarketTodayCards from './MarketTodayCards';
import CommodityMovers from './CommodityMovers';
import CommodityExpertsPick from './CommodityExpertsPick';
import CommodityOptionChain from './CommodityOptionChain';
import KnowledgeCentre from '../dashboard/KnowledgeCentre';

export const CommodityLandingPage = () => {
  return (
    <div className="space-y-3">
      {/* 1. Market Today 4-Card Stats Bar */}
      <MarketTodayCards />

      {/* 2. Main 55 : 45 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-3 items-start">
        {/* Left Column: Commodity Movers (55% Width) */}
        <section className="space-y-3 min-w-0">
          <CommodityMovers />
        </section>

        {/* Right Column: Expert's Pick, Option Chain & Knowledge Centre (45% Width) */}
        <section className="space-y-3 min-w-0">
          {/* Expert's Pick */}
          <CommodityExpertsPick />

          {/* Option Chain (Gold, Silver, Natural gas, Crude Oil) */}
          <CommodityOptionChain />

          {/* Knowledge Centre Educational Cards */}
          <KnowledgeCentre />
        </section>
      </div>
    </div>
  );
};

export default CommodityLandingPage;

