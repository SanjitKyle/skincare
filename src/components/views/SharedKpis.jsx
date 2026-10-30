import React from 'react';

export const PatientKpi = ({ title, value, subtext, icon: Icon, percentage, trendUp }) => {
  const formattedPercentage = percentage 
    ? (typeof percentage === 'string' ? percentage.replace(/%+$/, '') : percentage) + '%'
    : null;

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-5 flex flex-col justify-between group shadow-xs hover:border-cyan-200 hover:shadow-md transition-all min-w-0 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-cyan-500 before:scale-x-0 before:origin-left group-hover:before:scale-x-100 before:transition-transform">
      <div className="flex justify-between items-start mb-1.5 sm:mb-4 gap-1">
        <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">{title}</p>
        <div className="p-1 sm:p-2.5 rounded-lg sm:rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 group-hover:scale-105 group-hover:bg-cyan-100 transition-transform shrink-0">
          <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
      </div>
      
      <div className="min-w-0">
        <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1 truncate">{value}</h3>
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate">{subtext}</p>
          {formattedPercentage && (
            <span className={`text-[9px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
              trendUp ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {trendUp ? '↑ ' : ''}{formattedPercentage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const AppointmentKpi = ({ title, value, subtext, icon: Icon }) => (
  <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-5 flex flex-col justify-between group shadow-xs hover:border-teal-200 hover:shadow-md transition-all min-w-0 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-teal-500 before:scale-x-0 before:origin-left group-hover:before:scale-x-100 before:transition-transform">
    <div className="flex justify-between items-start mb-1.5 sm:mb-4 gap-1">
      <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">{title}</p>
      <div className="p-1 sm:p-2.5 rounded-lg sm:rounded-xl bg-teal-50 text-teal-700 border border-teal-100 group-hover:scale-105 group-hover:bg-teal-100 transition-transform shrink-0">
        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
      </div>
    </div>
    
    <div className="min-w-0">
      <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-0.5 sm:mb-1 truncate">{value}</h3>
      <p className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate">{subtext}</p>
    </div>
  </div>
);
