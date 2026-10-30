import React from 'react';

export const EmptyView = ({ title }) => (
  <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">This module is currently populated with dummy data.</p>
    </div>
    <div className="saas-card flex-1 bg-white p-8 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <div className="w-8 h-8 bg-slate-200 rounded-md"></div>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No data available</h3>
      <p className="text-sm text-slate-500 max-w-sm">
        This is a visual placeholder for the Kydoc {title} layout. Connect your backend API to see real data here.
      </p>
    </div>
  </div>
);
