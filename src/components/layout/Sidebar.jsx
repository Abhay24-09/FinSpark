import { useState } from 'react';
import {
  Compass,
  Bookmark,
  Briefcase,
  SlidersHorizontal,
  FileText,
  Clock,
  Settings,
  HelpCircle,
} from 'lucide-react';

export const Sidebar = ({ activeTab: controlledActiveTab, onTabChange }) => {
  const [internalActiveTab, setInternalActiveTab] = useState('explore');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (tabId) => {
    setInternalActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const navItems = [
    { id: 'explore', icon: Compass, label: 'Explore' },
    { id: 'watchlist', icon: Bookmark, label: 'Watchlist' },
    { id: 'holdings', icon: Briefcase, label: 'Holdings' },
    { id: 'positions', icon: SlidersHorizontal, label: 'Positions' },
    { id: 'orders', icon: FileText, label: 'Orders' },
  ];

  const bottomItems = [
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'help', icon: HelpCircle, label: 'Support' },
  ];

  return (
    <aside className="w-14 sm:w-16 bg-sidebar-bg border-r border-sidebar-border h-[calc(100vh-86px)] sticky top-[86px] flex flex-col items-center justify-between py-4 shrink-0 z-40 hover:z-50 select-none transition-all">
      {/* Top Navigation Items */}
      <div className="flex flex-col items-center gap-3 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              title={item.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-[#FFEAD5] text-[#FF7A00] font-semibold shadow-xs'
                  : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" />
              {/* Tooltip on hover: positioned cleanly to the right of the sidebar */}
              <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-medium rounded-md shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 drop-shadow-md">
                {item.label}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Settings & Help Items */}
      <div className="flex flex-col items-center gap-3 w-full">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              title={item.label}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-all cursor-pointer relative group"
            >
              <Icon className="w-5 h-5" />
              <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-medium rounded-md shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 drop-shadow-md">
                {item.label}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
