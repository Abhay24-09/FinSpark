import CompanyLogo from '../common/CompanyLogo';

export const ContractRow = ({ contract }) => {
  return (
    <div className="flex items-center justify-between py-2 px-1 hover:bg-gray-50/80 rounded-lg transition-colors cursor-pointer group select-none">
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <CompanyLogo size={28} />
        <div className="truncate">
          <div className="text-xs font-semibold text-text-main group-hover:text-primary transition-colors truncate">
            {contract.name}
          </div>
          <div className="text-[10px] text-text-light font-medium">
            {contract.exchange}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-bold text-text-main">
          {contract.price}
        </div>
        <div
          className={`text-[10px] font-semibold ${
            contract.isPositive ? 'text-success' : 'text-danger'
          }`}
        >
          {contract.change}
        </div>
      </div>
    </div>
  );
};

export default ContractRow;

