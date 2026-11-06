import { useState } from 'react';
import mascotImage from '../../assets/no-positions-mascot.png';

/**
 * PositionsCard
 * ---------------------------------------------------------------------------
 * Displays Positions, Holdings, and Orders matching the Figma Turbo Web UI:
 * - Subtabs: Positions | Holdings | Orders
 * - Cute mascot empty state with friendly message
 * - Renders placed orders and simulated positions dynamically
 */
export const PositionsCard = ({ positions = [], orders = [], holdings = [], onOpenOrderModal }) => {
  const [activeTab, setActiveTab] = useState('positions');

  const tabs = [
    { id: 'positions', label: 'Positions', count: positions.length },
    { id: 'holdings', label: 'Holdings', count: holdings.length },
    { id: 'orders', label: 'Orders', count: orders.length },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs p-3.5 space-y-3">
      {/* Subtab Navigation: Positions | Holdings | Orders */}
      <div className="flex items-center gap-6 border-b border-gray-100 pb-2 text-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-1.5 font-semibold cursor-pointer transition-colors ${
                isActive ? 'text-[#603DC8] font-bold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#603DC8]/10 text-[#603DC8]">
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#603DC8] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px] flex flex-col justify-center items-center py-3 px-2">
        {activeTab === 'positions' && (
          <>
            {positions.length === 0 ? (
              <div className="text-center space-y-2 max-w-[280px]">
                {/* Whimsical Mascot Illustration (from Figma screenshot) */}
                <div className="mx-auto w-24 h-24 flex items-center justify-center">
                  <img
                    src={mascotImage}
                    alt="No Active Positions"
                    className="w-24 h-24 object-contain select-none pointer-events-none"
                    loading="lazy"
                  />
                </div>


                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-900">
                    You have No Active Positions!
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Active Positions will appear here. Add to Positions by placing order in the market.
                  </p>
                </div>

                {onOpenOrderModal && (
                  <button
                    type="button"
                    onClick={() => onOpenOrderModal('BUY')}
                    className="mt-2 text-xs font-semibold px-3 py-1.5 bg-[#603DC8]/10 text-[#603DC8] hover:bg-[#603DC8]/20 rounded-lg transition-colors cursor-pointer"
                  >
                    Place an Order
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full divide-y divide-gray-100">
                {positions.map((pos, i) => (
                  <div key={i} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900">{pos.symbol}</div>
                      <div className="text-[10px] text-gray-500">
                        Qty: {pos.qty} • Avg: ₹{pos.avgPrice}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${pos.pnl >= 0 ? 'text-[#039855]' : 'text-[#F04438]'}`}>
                        {pos.pnl >= 0 ? '+' : ''}₹{pos.pnl.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-500">{pos.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'holdings' && (
          <div className="text-center py-6 text-xs text-gray-500">
            No active equity holdings found in portfolio.
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="w-full">
            {orders.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">
                No orders placed in this session.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 w-full text-xs">
                {orders.map((ord, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <span className={`font-bold mr-1.5 ${ord.action === 'BUY' ? 'text-[#039855]' : 'text-[#F04438]'}`}>
                        {ord.action}
                      </span>
                      <span className="font-semibold text-gray-900">{ord.symbol}</span>
                      <div className="text-[10px] text-gray-400">
                        {ord.qty} Qty • ₹{ord.price} • {ord.time}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      {ord.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionsCard;
