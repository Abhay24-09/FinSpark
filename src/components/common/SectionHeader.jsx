export const SectionHeader = ({
  title,
  subtitle,
  rightElement,
  viewAllLink,
  onViewAll,
  viewAllColor = 'text-accent',
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-2 pb-2 ${className}`}>
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold text-text-main tracking-tight">{title}</h2>
        {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
      </div>

      <div className="flex items-center gap-3">
        {rightElement}
        {(viewAllLink || onViewAll) && (
          <button
            onClick={onViewAll}
            type="button"
            className={`text-xs font-semibold ${viewAllColor} hover:underline cursor-pointer transition-colors`}
          >
            View all
          </button>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;
