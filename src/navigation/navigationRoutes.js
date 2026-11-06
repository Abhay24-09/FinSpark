/**
 * Turbo Web UI Navigation Scaffold
 * -----------------------------------------------------------------------------
 * Reverse-engineered directly from the official Figma Document Tree:
 * File: "Turbo Web UI" (Key: Wlia9C3HHAPavzrpaaD4Kw)
 * Page: "Turbo Web UI : Ready for Dev ✅" (Node ID: 2524:1825)
 * 
 * Total Document Sections: 12
 * Total Top-Level Frames / Screens: 75+
 * Prototype Flow Starting Points: 3
 */

export const FIGMA_METADATA = {
  fileKey: 'Wlia9C3HHAPavzrpaaD4Kw',
  fileName: 'Turbo Web UI',
  activePageId: '2524:1825',
  activePageName: 'Turbo Web UI : Ready for Dev ✅',
  flowStartingPoints: [
    { name: 'Flow 1', nodeId: '6212:3371', description: 'Primary Trading & Portfolio Dashboard' },
    { name: 'Default Login', nodeId: '6512:12476', description: 'Standard Account Login & MPIN Auth' },
    { name: 'Registed User: First Even Login', nodeId: '6512:17788', description: 'Onboarding & First-Time User Experience' },
  ],
};

/**
 * 12 Top-Level Sections & All Screens/Frames from Figma
 */
export const FIGMA_NAVIGATION_TREE = {
  // 1. HOME MODULE
  HOME: {
    id: '6231:3373',
    name: 'Home Module',
    route: '/',
    categoryTabs: ['stocks', 'fno', 'commodity'],
    screens: [
      {
        name: 'Stocks',
        nodeId: '6242:1725',
        subScreens: [
          'Stocks: Landing Page',
          'Expanded view',
          'Stocks: Market Movers',
          'Stocks: Stocks By Sector',
          'Stocks: FII/DII_Cash',
          'Stocks: FII/DII_Derivative',
          'Stocks: Collections for you',
          'Stocks: Top Business Groups',
          'Stocks: News & Updates',
          'Stocks: Research Reports',
        ],
      },
      {
        name: 'FnO',
        nodeId: '6329:3801',
        subScreens: [
          'FnO: Landing Page',
          'FnO: Market Movers',
          'FnO: Expiring Soon',
          'FnO: OI Buildup',
          'FnO: Option Chain',
          'FnO: OI Analysis',
          'FnO: Futures Dashboard',
        ],
      },
      {
        name: 'Commodity',
        nodeId: '7600:48213',
        subScreens: [
          'Commodity: Landing Page',
          'Commodity: Market Movers',
          'Commodity: Option Chain',
        ],
      },
      {
        name: 'Search Scrip',
        nodeId: '6461:6956',
        subScreens: ['Search Interaction Step 1', 'Search Interaction: Step 2'],
      },
      {
        name: 'PIN Scrip to Header',
        nodeId: '6702:14512',
        subScreens: ['Edit Header PINs'],
      },
      {
        name: 'Notification',
        nodeId: '6702:14093',
        subScreens: ['Sidebar: Notification Filled State', 'Sidebar: Notification Empty State'],
      },
    ],
  },

  // 2. WATCHLIST VIEW
  WATCHLIST: {
    id: '6231:3374',
    name: 'Watchlist View',
    route: '/watchlist',
    screens: [
      { name: 'Watchlist Default View', nodeId: '6329:7815', type: 'primary' },
      { name: 'Watchlist Extended View', nodeId: '6231:3375', type: 'split_chart_depth' },
      { name: 'Create New Watchlist', nodeId: '6478:7549', type: 'modal_wizard' },
      { name: 'Manage Watchlist', nodeId: '6480:9284', type: 'management' },
      { name: 'Pop-up: Delete Watchlist?', nodeId: '6480:11229', type: 'dialog' },
      { name: 'Adding to watchlist', nodeId: '6461:7106', type: 'flow' },
      { name: 'Watchlist to Basket', nodeId: '8074:52663', type: 'flow' },
      { name: 'Filter Sidebar', nodeId: '7737:52410', type: 'sidebar_drawer' },
      { name: 'Bulk-Action Dropdown', nodeId: '6446:6310', type: 'dropdown_menu' },
    ],
  },

  // 3. BASKET MODULE
  BASKET: {
    id: '7700:65531',
    name: 'Basket',
    route: '/basket',
    screens: [
      {
        name: 'Create New Basket',
        nodeId: '7700:66743',
        subScreens: ['Create Basket Form', 'Order_Basket', 'Add To Basket', 'Added To Basket'],
      },
      {
        name: 'Edit Basket',
        nodeId: '7716:49161',
        subScreens: ['Edit Basket List', 'Basket List', 'Pop-up: Save Changes'],
      },
      {
        name: 'Execute Basket Order',
        nodeId: '7716:53652',
        subScreens: ['Basket List', 'Basket Detail View', 'Basket Order Placed', 'Pop-up: Execute Basket'],
      },
    ],
  },

  // 4. VIEW (SCRIP / STOCK / INDEX DETAILS)
  VIEW: {
    id: '6480:11728',
    name: 'View (Scrip & Market Details)',
    route: '/view/:symbol',
    screens: [
      {
        name: 'Stock Detail View UI',
        nodeId: '6669:11815',
        subScreens: [
          'Stock View: Overview',
          'Stock View: Technicals',
          'Stock View: Fundamentals',
          'Stock View: FnO',
          'Stock View: Option Chain',
          'Stock View: News',
          'CHART EXPANDED VIEW',
        ],
      },
      {
        name: 'Buy/Sell Screen UI + Interaction',
        nodeId: '6760:21402',
        subScreens: [
          'Stock Buy Screen (Full-Height Side Drawer)',
          'Stock Sell Screen',
          'FnO Buy Screen',
          'FnO Sell Screen',
          'Advance Options (Stop-Loss / Target / Disclosed Qty)',
          'Pay Later (1x MTF Margin Integration)',
        ],
      },
      {
        name: 'Index View UI',
        nodeId: '6669:11816',
        subScreens: ['Index View: Overview', 'Indices View: Technicals', 'Indices View: Stocks', 'Indices View: FnO', 'Indices View: Option Chain'],
      },
      {
        name: 'Futures & Options Views',
        nodeId: '6679:16587',
        subScreens: [
          'Index Future View: Overview',
          'Index Option View: Overview',
          'Stock Future View: Overview',
          'Stock Option View: Overview',
          'Commodity Future View: Overview',
          'Commodity Option View: Overview',
        ],
      },
      {
        name: 'Quick Action',
        nodeId: '7138:38098',
        subScreens: [
          'Bulk-Action Dropdown',
          'Pop-up: Pin Script to Header 1',
          'Pop-up: Pin Script to Header 2',
          'Sidebar: Price Alerts',
          'Sidebar: Add Scrip to basket',
        ],
      },
      {
        name: 'Edge/Error Screens',
        nodeId: '6822:19250',
        subScreens: ['Verify Sell: Step 1', 'Verify Sell: Step 2', 'Precautionary Message', 'Error Screen Sample', 'AMO Order Sample'],
      },
    ],
  },

  // 5. PORTFOLIO / HOLDINGS
  PORTFOLIO: {
    id: '6584:11041',
    name: 'Portfolio (Holdings)',
    route: '/holdings',
    screens: [
      {
        name: 'Holding UI',
        nodeId: '6685:26723',
        subScreens: [
          'Portfolio: Holdings_Collapsed',
          'Portfolio: Holdings_Expanded',
          'Holding Details + Pledged',
          'Holding Details + SL+TGT',
          'Holding Details [After Corporate Action]',
          'Holding Details MTF',
        ],
      },
    ],
  },

  // 6. POSITIONS
  POSITIONS: {
    id: '6685:29300',
    name: 'Positions',
    route: '/positions',
    screens: [
      { name: 'Position: Positions_default View', nodeId: '6685:29610', type: 'table_view' },
      { name: 'Position: Position_collapsed_Open', nodeId: '6685:29301', type: 'filter_view' },
      { name: 'Position: Position_collapsed_Orders', nodeId: '6891:32455', type: 'linked_orders' },
      { name: 'Portfolio: Position Details', nodeId: '6889:28066', type: 'detail_drawer' },
      { name: 'Portfolio: MTF', nodeId: '7752:56672', type: 'mtf_positions' },
      {
        name: 'Set SL/Target Flow',
        nodeId: '6891:31355',
        subScreens: ['Set Stop-Loss 1', 'Set Stop Loss 2', 'Set Stop Loss 3'],
      },
      {
        name: 'Conversion flow',
        nodeId: '6896:33122',
        subScreens: ['Convert to Delivery', 'Pop-up: Convert Delivery?'],
      },
      {
        name: 'Exit Position Flow',
        nodeId: '6906:29375',
        subScreens: ['Exit Position Screen', 'Exit All Positions Confirmation'],
      },
    ],
  },

  // 7. ORDERS
  ORDERS: {
    id: '6927:33170',
    name: 'Orders',
    route: '/orders',
    subTabs: ['all', 'open', 'executed', 'gtt', 'mtf', 'sip', 'basket'],
    screens: [
      { name: 'Order_All_Regular', nodeId: '6927:32805' },
      { name: 'Order_All_GTT', nodeId: '6956:31397' },
      { name: 'Order_All_Trigger', nodeId: '6956:31875' },
      { name: 'Order_All_MTF', nodeId: '7006:36896' },
      { name: 'Order_SIP', nodeId: '7700:73735' },
      { name: 'Order_Basket', nodeId: '7700:74028' },
      { name: 'Order: Open_Regular', nodeId: '6956:30955' },
      { name: 'Order: Close_Regular', nodeId: '6959:33152' },
      {
        name: 'Open Order Details',
        nodeId: '6988:33317',
        subScreens: [
          'Sidebar_Order_Details: Equity + Stop Loss',
          'Sidebar_Order_Details: Equity + Partially Executed',
          'Sidebar_Order_Details: FnO + Sell Pending',
          'Sidebar_Order_Details: Trigger',
          'Sidebar_Order_Details: GTT',
        ],
      },
      {
        name: 'Closed Order Details',
        nodeId: '6988:35287',
        subScreens: [
          'Sidebar_Order_Details: Equity BUY',
          'Sidebar_Order_Details: Rejected',
          'Sidebar_Order_Details: Cancelled',
          'Sidebar_Order_Details: FnO Buy',
          'Sidebar_Order_Details: GTT OCO',
          'Sidebar_Order_Details: PayLater',
        ],
      },
      {
        name: 'SIP Management',
        nodeId: '7710:49243',
        subScreens: ['SIP Details_Monthly', 'Basket SIP Details', 'SIP Details_Weekly'],
      },
      {
        name: 'Cancel Order Flow',
        nodeId: '8052:51205',
        subScreens: ['Cancel Individual Order', 'Pop-up: Cancel Order?', 'Cancel All Orders: Select items'],
      },
    ],
  },

  // 8. OPTION CHAIN ADVANCED VIEW
  OPTION_CHAIN: {
    id: '7385:41661',
    name: 'Option Chain Advanced View',
    route: '/option-chain/:symbol?',
    screens: [
      { name: 'Landing View', nodeId: '7385:41850', type: 'advanced_grid' },
      { name: 'Search Scrip', nodeId: '7385:42715', type: 'symbol_picker' },
      { name: 'Overlay: Buy_Delivery_Market', nodeId: '7391:49369', type: 'quick_order_modal' },
      {
        name: 'Basket Order Builder',
        nodeId: '7391:49513',
        subScreens: ['Basket Order Active', 'Basket Order Active: Added', 'Basket Order Active: Cart', 'Basket Order: Save to Basket'],
      },
    ],
  },

  // 9. PROFILE & SETTINGS
  PROFILE: {
    id: '7034:40924',
    name: 'Profile & Account',
    route: '/profile',
    screens: [
      { name: 'Profile UI_default View', nodeId: '7041:36344', type: 'overview' },
      {
        name: 'Settings',
        nodeId: '7103:37735',
        subScreens: ['Settings_Notification', 'Settings_Alerts', 'Settings_Order Preferences', 'Settings_Quick Settings'],
      },
      {
        name: 'Funds',
        nodeId: '7103:37737',
        subScreens: ['Profile UI_Funds', 'Profile: Funds_Breakdown', 'View Transaction History', 'Add Fund flow', 'Withdraw Funds', 'Pledge flow'],
      },
      { name: 'Bank Account', nodeId: '7103:41572', subScreens: ['Profile UI_Bank account', 'Sidebar: Bank Account Details'] },
      { name: 'Support', nodeId: '7103:45576', type: 'customer_support' },
      { name: 'About Us', nodeId: '7103:46234', type: 'legal_company' },
      { name: 'Logout', nodeId: '7103:42788', subScreens: ['Pop-up: Switch Account', 'Pop-up: Logout'] },
    ],
  },

  // 10. AUTHENTICATION & LOGIN FLOW
  LOGIN_FLOW: {
    id: '6504:11834',
    name: 'Login Flow',
    route: '/login',
    screens: [
      { name: 'Splash Screen', nodeId: '6512:12474' },
      { name: 'Standard Login', nodeId: '6512:12475' },
      { name: 'Forgot Password', nodeId: '6526:22916' },
      { name: 'Forgot MPIN', nodeId: '6696:14590' },
      { name: 'Wrong MPIN/OTP', nodeId: '6696:15014' },
      {
        name: 'First Time Login Flow: Registered User',
        nodeId: '6512:13583',
        subScreens: ['Onboarding:1.1', 'Onboarding:1.2', 'Onboarding:1.3', 'Onboarding:1.4', 'Enter Mobile Number', 'OTP', 'Set MPIN'],
      },
      {
        name: 'If User is not Registered',
        nodeId: '6526:19389',
        subScreens: ['Enter Mobile Number', 'OTP Verification', 'Open Demat Account Form', 'Set MPIN'],
      },
      {
        name: 'Switch/Multiple Account Flow',
        nodeId: '6526:18732',
        subScreens: ['Through MPIN', 'Through Login'],
      },
    ],
  },

  // 11. GUEST USER FLOW
  GUEST_USER: {
    id: '7532:52586',
    name: 'Guest User Flow (Demo Mode)',
    route: '/guest',
    screens: [
      { name: 'Home UI : Demo Login Landing View', nodeId: '7532:52587' },
      { name: 'Watchlist UI : Demo Login Landing View', nodeId: '7532:57410' },
      { name: 'Positions : Demo Login Landing View', nodeId: '7532:58164' },
      { name: 'Holdings : Demo Login Landing View', nodeId: '7536:58648' },
      { name: 'Orders : Demo Login Landing View', nodeId: '7536:58395' },
      { name: 'Profile : Demo Login Landing View', nodeId: '7536:58902' },
      {
        name: 'First Time Login Flow: GUEST USER',
        nodeId: '13478:55251',
        subScreens: ['Enter Mobile Number', 'OTP', 'Open Demat Account', 'Set MPIN'],
      },
    ],
  },

  // 12. SYSTEM & MISCELLANEOUS SCREENS
  MISCELLANEOUS: {
    id: '7527:44315',
    name: 'Miscellaneous Screens',
    route: '/system',
    screens: [
      { name: 'Session Expired', nodeId: '7528:44316', type: 'session_modal' },
      { name: 'Rate Us', nodeId: '7530:48031', type: 'feedback_dialog' },
      { name: 'Activate DDPI', nodeId: '7532:51134', type: 'ddpi_onboarding' },
      { name: 'Stock SIP Live', nodeId: '7532:51879', type: 'sip_announcement' },
      { name: 'Trading Halted UI "Market Wide"', nodeId: '7532:49107', type: 'circuit_halt_overlay' },
      { name: 'Trading Halted for Specific Scrip', nodeId: '7532:50518', type: 'stock_circuit_halt' },
      { name: 'Maintenance Alert', nodeId: '7528:45015', type: 'downtime_banner' },
      { name: 'No Internet Connection', nodeId: '7528:46712', type: 'offline_state' },
    ],
  },
};

/**
 * Navigation Flow Controller
 * -----------------------------------------------------------------------------
 * Translates Figma's interactive transitions into executable state transitions
 * for FinSpark's DashboardLayout and Sidebar routers.
 */
export const NAVIGATION_FLOW_CONTROLLER = {
  // Sidebar Main Tabs
  SIDEBAR_TABS: [
    { id: 'explore', label: 'Explore', icon: 'Compass', targetSection: 'HOME', defaultView: 'dashboard' },
    { id: 'watchlist', label: 'Watchlist', icon: 'Bookmark', targetSection: 'WATCHLIST', defaultView: 'watchlist' },
    { id: 'holdings', label: 'Holdings', icon: 'Briefcase', targetSection: 'PORTFOLIO', defaultView: 'holdings' },
    { id: 'positions', label: 'Positions', icon: 'SlidersHorizontal', targetSection: 'POSITIONS', defaultView: 'positions' },
    { id: 'orders', label: 'Orders', icon: 'FileText', targetSection: 'ORDERS', defaultView: 'orders' },
    { id: 'settings', label: 'Settings', icon: 'Settings', targetSection: 'PROFILE', defaultView: 'profile_settings' },
    { id: 'help', label: 'Support', icon: 'HelpCircle', targetSection: 'PROFILE', defaultView: 'profile_support' },
  ],

  // Contextual Drawers & Modals
  OVERLAYS: {
    BUY_SELL_DRAWER: {
      component: 'RightOrderPanel',
      type: 'drawer',
      placement: 'right',
      height: 'h-screen',
      width: 'w-[420px]',
      hasBackdrop: false,
    },
    PIN_SCRIP_MODAL: {
      component: 'PinScripModal',
      type: 'modal',
      placement: 'center',
    },
    BULK_ACTIONS_DROPDOWN: {
      component: 'BulkActionDropdown',
      type: 'dropdown',
    },
    ORDER_DETAILS_DRAWER: {
      component: 'OrderDetailsDrawer',
      type: 'drawer',
      placement: 'right',
    },
    FILTER_SIDEBAR: {
      component: 'FilterSidebar',
      type: 'drawer',
      placement: 'right',
    },
  },
};

export default FIGMA_NAVIGATION_TREE;

