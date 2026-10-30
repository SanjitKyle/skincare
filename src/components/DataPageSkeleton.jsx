import React from 'react';

const Block = ({ className }) => <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;

export const DataPageSkeleton = ({ kpis = 4, rows = 5 }) => (
  <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto space-y-4" aria-label="Loading data">
    <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs"><Block className="h-8 w-40" /><Block className="h-4 w-72 max-w-full mt-3" /></section>
    <div className={`grid grid-cols-2 ${kpis === 3 ? 'md:grid-cols-3' : 'lg:grid-cols-4'} gap-3 sm:gap-4`}>{Array.from({ length: kpis }).map((_, index) => <section key={index} className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 min-h-[132px]"><Block className="h-3 w-20" /><Block className="h-8 w-12 mt-5" /><Block className="h-3 w-24 mt-5" /></section>)}</div>
    <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs"><div className="p-4 border-b border-slate-100"><Block className="h-10 w-full max-w-md" /></div><div className="hidden md:grid grid-cols-6 gap-5 px-6 py-4 bg-slate-50 border-b border-slate-200">{Array.from({ length: 6 }).map((_, index) => <Block key={index} className="h-3 w-full" />)}</div><div className="p-4 space-y-4">{Array.from({ length: rows }).map((_, index) => <div key={index} className="grid grid-cols-3 md:grid-cols-6 gap-4"><Block className="h-10 w-full" /><Block className="h-10 w-full" /><Block className="h-10 w-full" /><Block className="hidden md:block h-10 w-full" /><Block className="hidden md:block h-10 w-full" /><Block className="hidden md:block h-10 w-full" /></div>)}</div></section>
  </div>
);
