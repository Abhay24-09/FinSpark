import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Landmark,
  ShoppingBag,
  Lightbulb,
  Fuel,
  Car,
  Building2,
  Pickaxe,
  Factory,
  Users,
} from 'lucide-react';
import DetailStocksTable from '../common/DetailStocksTable';
import { SECTORS_LIST, SECTOR_STOCKS_DATA } from '../../data/sectorsData';

const SECTOR_ICON_MAP = {
  landmark: Landmark,
  shopping_bag: ShoppingBag,
  lightbulb: Lightbulb,
  fuel: Fuel,
  car: Car,
  building: Building2,
  pickaxe: Pickaxe,
  factory: Factory,
  users: Users,
};

export const StocksBySectorDetail = ({ onBack, searchQuery = '', onSelectStock }) => {
  const [selectedSectorId, setSelectedSectorId] = useState('banking_finance');

  const selectedSector = useMemo(() => {
    return (
      SECTORS_LIST.find((s) => s.id === selectedSectorId) || SECTORS_LIST[0]
    );
  }, [selectedSectorId]);

  // Filter stocks based on selected sector and optional search query
  const displayedStocks = useMemo(() => {
    const allowedSymbols = new Set(selectedSector.stockSymbols);

    return SECTOR_STOCKS_DATA.filter((stock) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          stock.name.toLowerCase().includes(q) ||
          stock.symbol.toLowerCase().includes(q) ||
          stock.exchange.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Sector filter: if Banking and Finance, show all 12 stocks matching design
      if (selectedSectorId === 'banking_finance') {
        return true;
      }

      // Otherwise filter by sector's curated symbols
      return allowedSymbols.has(stock.symbol);
    });
  }, [selectedSector, selectedSectorId, searchQuery]);

  return (
    <div className="bg-card-bg rounded-xl border border-card-border shadow-xs overflow-hidden">
      {/* Top Header: Back Arrow + Title */}
      <div className="px-4 sm:px-5 py-3 border-b border-card-border flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-gray-100 transition-colors cursor-pointer"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-text-main tracking-tight">
          Stocks by Sectors
        </h1>
      </div>

      {/* Main Two-Column View */}
      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Left Column: Sectors List */}
        <aside className="w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-card-border p-3 sm:p-4 space-y-1.5 overflow-y-auto max-h-[750px] no-scrollbar">
          {SECTORS_LIST.map((sector) => {
            const Icon = SECTOR_ICON_MAP[sector.iconKey] || Landmark;
            const isActive = selectedSectorId === sector.id;

            return (
              <div
                key={sector.id}
                onClick={() => setSelectedSectorId(sector.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 select-none ${
                  isActive
                    ? 'bg-primary-light text-primary shadow-2xs'
                    : 'hover:bg-gray-50/80 text-text-main'
                }`}
              >
                {/* Sector Icon */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white text-primary shadow-2xs'
                      : 'bg-gray-100 text-primary/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Sector Details */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isActive ? 'text-primary' : 'text-text-main'
                    }`}
                  >
                    {sector.name}
                  </div>
                  <p className="text-[11px] text-text-muted leading-snug mt-1 line-clamp-2">
                    {sector.description}
                  </p>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Right Column: Stocks Table */}
        <main className="flex-1 min-w-0 p-3 sm:p-5">
          <DetailStocksTable stocks={displayedStocks} onSelectStock={onSelectStock} />
        </main>
      </div>
    </div>
  );
};

export default StocksBySectorDetail;

