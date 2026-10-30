import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserRole, ROLE_DETAILS } from '../../utils/rbac';

export const Unauthorized = () => {
  const navigate = useNavigate();
  const role = getUserRole();
  const details = ROLE_DETAILS[role] || { label: role };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-6 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-3 uppercase tracking-wider bg-slate-100 text-slate-700 border-slate-200">
        Current Role: <span className="text-indigo-600">{details.label}</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
        Access Restricted
      </h1>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 font-medium">
        You do not have permission to view this module. If you believe you should have access, please contact your clinic administrator.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs shadow-indigo-600/20"
        >
          <Home className="w-4 h-4" /> Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
