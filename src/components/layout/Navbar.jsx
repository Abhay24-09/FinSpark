import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Gift, Wallet, Bell } from 'lucide-react';
import logo from '../../assets/logo.png';
import { STOCK_DATA } from '../../data/marketData';

export const Navbar = ({ searchQuery, onSearchChange, onSelectStock, onGoHome }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Filter stocks based on query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return STOCK_DATA.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.symbol && s.symbol.toLowerCase().includes(q)) ||
        (s.tradingSymbol && s.tradingSymbol.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      style={{ top: '30px' }}
      className="w-full bg-card-bg border-b border-card-border sticky top-[30px] z-50"
    >
      <div className="w-full px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3 -ml-[5px]">
          <div
            onClick={() => {
              if (onGoHome) onGoHome();
              else if (typeof window !== 'undefined') window.location.hash = '#/';
            }}
            className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shadow-xs cursor-pointer hover:opacity-95 transition-opacity bg-card-bg"
            title="Go to Dashboard / Explore"
          >
            <img src={logo} alt="Logo" className="w-full h-full object-contain rounded-full" />
          </div>
        </div>

        {/* Center: Search Bar with Autocomplete Dropdown */}
        <div ref={searchContainerRef} className="flex-1 max-w-xl mx-4 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-light" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search stocks, indices, collections..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-full text-xs font-medium text-text-main placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-card-bg transition-all"
            />
          </div>

          {/* Quick Autocomplete Search Results */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-card-bg rounded-xl border border-card-border shadow-lg py-1.5 z-50 divide-y divide-gray-100 animate-in fade-in duration-100">
              <div className="px-3 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Matching Stocks
              </div>
              {searchResults.map((stock) => (
                <div
                  key={stock.id}
                  onClick={() => {
                    if (onSelectStock) onSelectStock(stock);
                    setIsDropdownOpen(false);
                    onSearchChange('');
                  }}
                  className="px-3 py-2 flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer select-none"
                >
                  <div>
                    <div className="font-bold text-xs text-text-main hover:text-primary transition-colors">
                      {stock.name}
                    </div>
                    <div className="text-[10px] text-text-muted font-medium">
                      {stock.exchange} • {stock.symbol || stock.tradingSymbol}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-text-main">{stock.price}</div>
                    <div
                      className={`text-[10px] font-semibold ${
                        stock.isPositive ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {stock.change} ({stock.changePercent})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Actions, Wallet, Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Refer & Earn Button */}
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light text-primary text-xs font-semibold hover:bg-primary-light-hover transition-colors cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5 text-primary" />
            <span>Refer &amp; Earn</span>
          </button>

          {/* Wallet Balance Pill matching Figma */}
          <div className="flex items-center gap-1.5 px-3 py-1 text-gray-900 font-semibold text-xs border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">
            <Wallet className="w-3.5 h-3.5 text-gray-500" />
            <span>₹ 22,626.40</span>
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="relative p-1.5 text-text-muted hover:text-text-main rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Profile Avatar */}
          <div className="relative cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/40">
              TB
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white"></span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
