/**
 * Interactive Exchange Toggle (NSE ⇄ BSE) matching Figma prototype:
 * - Two distinct clickable pill badges side-by-side: [NSE] and [BSE]
 * - Direct click on either pill immediately selects that exchange
 * - Active pill highlighted in vibrant orange (#FF7A00)
 * - Seamlessly dispatches exchange change to parent components
 */
export const ExchangeToggle = ({
  currentExchange = 'NSE',
  onToggle,
  className = '',
}) => {
  const isNSE = currentExchange === 'NSE';
  const isBSE = currentExchange === 'BSE';

  const handleSelect = (exchange) => {
    if (onToggle) {
      onToggle(exchange);
    }
  };

  return (
    <div
      role="group"
      aria-label="Select Exchange"
      className={`inline-flex items-center gap-1.5 select-none ${className}`}
    >
      {/* NSE Pill */}
      <button
        type="button"
        id="btn-exchange-nse"
        aria-pressed={isNSE}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect('NSE');
        }}
        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
          isNSE
            ? 'border border-[#FF7A00] bg-white text-[#FF7A00] shadow-2xs ring-1 ring-[#FF7A00]/30'
            : 'border border-gray-200/90 bg-gray-50 text-gray-500 hover:text-gray-900 hover:border-gray-300'
        }`}
        title="Switch to NSE Data"
      >
        NSE
      </button>

      {/* BSE Pill */}
      <button
        type="button"
        id="btn-exchange-bse"
        aria-pressed={isBSE}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect('BSE');
        }}
        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
          isBSE
            ? 'bg-[#FF7A00] text-white shadow-2xs border border-[#FF7A00]'
            : 'border border-gray-200/90 bg-gray-50 text-gray-500 hover:text-gray-900 hover:border-gray-300'
        }`}
        title="Switch to BSE Data"
      >
        BSE
      </button>
    </div>
  );
};

export default ExchangeToggle;
