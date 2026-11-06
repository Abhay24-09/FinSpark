import defaultOrgLogo from '../../assets/org-logo.png';

/**
 * Optimized and unified logo component for all stocks and organizations
 */
export const CompanyLogo = ({
  src = defaultOrgLogo,
  name = 'Organization',
  size = 32,
  className = '',
}) => {
  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`shrink-0 overflow-hidden flex items-center justify-center rounded-full bg-white select-none ${className}`}
    >
      <img
        src={src || defaultOrgLogo}
        alt={`${name} logo`}
        className="w-full h-full object-contain rounded-full"
        loading="lazy"
        onError={(e) => {
          // Fallback to default org logo if any broken custom src
          if (e.currentTarget.src !== defaultOrgLogo) {
            e.currentTarget.src = defaultOrgLogo;
          }
        }}
      />
    </div>
  );
};

export default CompanyLogo;
