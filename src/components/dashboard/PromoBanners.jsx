import { Sparkles, Gift } from 'lucide-react';

export const PromoBanners = () => {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
        {/* Banner 1: 5x Margin MTF */}
        <div className="md:col-span-7 bg-[#111322] rounded-xl p-3 sm:p-3.5 text-white relative overflow-hidden flex items-center justify-between shadow-xs">
          <div className="relative z-10 max-w-[65%]">
            <p className="text-xs text-gray-300 leading-tight">
              Get <span className="text-[#FDB022] font-bold">5x Margin</span> for your favourite stocks with
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F79009] text-white text-[11px] font-bold rounded-lg shadow-xs">
              <span>Pay Later (MTF)</span>
              <span className="text-[10px] opacity-90">@ 7.49% p.a.</span>
            </div>
          </div>

          {/* Decorative graphic */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-[#FDB022]" />
          </div>
        </div>

        {/* Banner 2: Refer & Earn */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#D1FADF] to-[#A6F4C5] rounded-xl p-3 sm:p-3.5 text-[#054F31] relative overflow-hidden flex items-center justify-between shadow-xs border border-emerald-200">
          <div className="relative z-10 max-w-[70%]">
            <span className="inline-block px-2 py-0.5 bg-[#FDB022] text-[#7A2E0E] text-[10px] font-extrabold rounded mb-1">
              ₹400/-
            </span>
            <h4 className="text-xs font-bold leading-tight">
              Refer &amp; Earn
            </h4>
            <p className="text-[10px] text-[#054F31]/80 mt-0.5 leading-snug">
              with our referral program and enjoy many benefits
            </p>
          </div>

          <div className="w-12 h-12 rounded-full bg-emerald-600/10 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-[#054F31]" />
          </div>
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <span className="w-2 h-2 rounded-full bg-accent"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
      </div>
    </div>
  );
};

export default PromoBanners;
