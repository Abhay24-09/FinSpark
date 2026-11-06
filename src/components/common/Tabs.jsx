/**
 * Reusable, accessible tab list component with theme-aware indicator
 */

export const Tabs = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline', // 'underline' | 'pill'
  size = 'md',           // 'sm' | 'md' | 'lg'
  hasBorder = false,     // whether to display full-width bottom border
  className = '',
}) => {
  return (
    <div
      className={`flex items-center overflow-x-auto no-scrollbar ${
        variant === 'underline'
          ? `${hasBorder ? 'border-b border-card-border ' : ''}gap-4 sm:gap-6`
          : 'gap-2'
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === 'pill') {
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-primary-light text-primary font-semibold'
                  : 'text-text-muted hover:text-text-main hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-text-muted'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        // Underline style (matches theme primary indicator)
        const sizeClasses = {
          sm: 'text-xs px-3 pb-2',
          md: 'text-sm px-4 pb-2.5',
          lg: 'text-base px-5 pb-3',
        };

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative font-medium whitespace-nowrap cursor-pointer transition-colors ${sizeClasses[size]} ${
              isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-text-main'
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
