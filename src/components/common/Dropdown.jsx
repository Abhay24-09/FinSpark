import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { INDEX_OPTIONS } from '../../data/marketData';

export const IndexDropdown = ({
  options = INDEX_OPTIONS,
  selectedId = 'nifty_50',
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.id === selectedId) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-text-main bg-card-bg border border-card-border rounded-md hover:bg-gray-50 focus:outline-none transition-all shadow-xs cursor-pointer"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span>{selectedOption?.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-44 rounded-lg bg-card-bg shadow-xl ring-1 ring-black/10 z-50 py-1.5 animate-in fade-in duration-150">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-text-light uppercase tracking-wider border-b border-card-border">
            Select Index
          </div>
          <div className="py-1">
            {options.map((option) => {
              const isChecked = option.id === selectedId;
              return (
                <label
                  key={option.id}
                  onClick={() => {
                    onSelect?.(option.id);
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                        isChecked ? 'border-accent bg-accent' : 'border-gray-300 bg-card-bg'
                      }`}
                    >
                      {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className={`font-medium ${isChecked ? 'text-text-main font-semibold' : 'text-text-muted'}`}>
                      {option.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-light font-medium">
                    {option.exchange}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndexDropdown;
