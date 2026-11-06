export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variantStyles = {
    gray: 'bg-gray-100 text-text-muted border border-card-border',
    purple: 'bg-primary-light text-primary border border-primary/20',
    green: 'bg-emerald-50 text-success border border-success/20',
    yellow: 'bg-warning-bg text-warning-text border border-warning-border',
    orange: 'bg-accent-light text-accent border border-accent/20',
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${variantStyles[variant] || variantStyles.gray} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
