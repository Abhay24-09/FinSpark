/**
 * FinSpark Global Theme Configuration
 * ------------------------------------
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL STYLING & THEMING IN THE APP.
 * Whenever you want to change colors, fonts, borders, or layout settings,
 * you only need to modify this single file!
 *
 * Changes made here will automatically propagate across all components,
 * cards, headers, sidebars, buttons, and badges.
 */

export const theme = {
  colors: {
    // Primary brand color (used for active tabs, collection badges, active underlines)
    primary: '#603DC8',
    primaryHover: '#4F2FA8',
    primaryLight: '#F1ECFE',
    primaryLightHover: '#E5DCFC',

    // Accent color (used for action buttons, "View all" links, active selections)
    accent: '#FF5722',
    accentHover: '#E64A19',
    accentLight: '#FFF0EB',

    // Status colors
    success: '#12B76A',       // Positive stocks, positive FII/DII flow
    danger: '#F04438',        // Negative stocks, losses
    warning: '#F59E0B',       // Warning icons
    warningBg: '#FFFBEB',     // Alert banner background
    warningBorder: '#FEF08A', // Alert banner border
    warningText: '#92400E',   // Alert banner text

    // Surfaces & Backgrounds
    appBg: '#F6F6F6',         // Main dashboard background
    cardBg: '#FFFFFF',        // Card container backgrounds
    cardBorder: '#F0F0F0',    // Card subtle border

    // Header & Ticker Bar
    tickerBg: '#081B13',      // Top ticker dark strip
    tickerBorder: 'rgba(6, 78, 59, 0.4)',
    tickerText: '#FFFFFF',

    // Left Navigation Sidebar
    sidebarBg: '#FFFFFF',
    sidebarBorder: '#E5E7EB',
    sidebarActiveBg: '#FF5722',
    sidebarActiveText: '#FFFFFF',
    sidebarInactiveText: '#9CA3AF',
    sidebarHoverBg: '#F3F4F6',

    // Typography
    textMain: '#111827',      // Primary headers & values
    textMuted: '#6B7280',     // Subtitles, exchange badges
    textLight: '#9CA3AF',
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  layout: {
    sidebarWidth: '64px',
    contentMaxWidth: '1600px',
    cardRadius: '12px',
  },
};

/**
 * Automatically applies the theme object to document CSS variables.
 * Enables both CSS/Tailwind and JS components to stay in sync dynamically.
 */
export const applyTheme = (customTheme = theme) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const { colors, typography, layout } = customTheme;

  // Map theme colors to CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    // Converts camelCase (e.g. primaryHover) to kebab-case (--theme-color-primary-hover)
    const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    root.style.setProperty(`--theme-color-${kebabKey}`, value);
  });

  // Map typography & layout
  if (typography?.fontFamily) {
    root.style.setProperty('--theme-font-family', typography.fontFamily);
  }
  if (layout?.sidebarWidth) {
    root.style.setProperty('--theme-sidebar-width', layout.sidebarWidth);
  }
  if (layout?.cardRadius) {
    root.style.setProperty('--theme-card-radius', layout.cardRadius);
  }
};

// Auto-apply theme when imported in browser environment
applyTheme(theme);

export default theme;

