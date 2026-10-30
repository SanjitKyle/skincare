import React from 'react';
import { X, Printer, CheckCircle, Clock, Stethoscope, User, Calendar, AlertTriangle } from 'lucide-react';
import { PRIORITY_LEVELS } from '../../services/queueStorage';

export const TokenSlipModal = ({ tokenData, onClose }) => {
  if (!tokenData) return null;

  const priorityMeta = PRIORITY_LEVELS[tokenData.priority] || PRIORITY_LEVELS.NORMAL;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto relative">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎟️</span>
            <div>
              <h3 className="text-sm font-black tracking-tight leading-tight">Clinic OPD Token</h3>
              <p className="text-[10px] text-cyan-100 font-semibold">Kydoc Healthcare</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 bg-white space-y-4 print:p-0" id="printable-token-slip">
          {/* Clinic Branding */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-base font-black tracking-tight text-slate-900">Ky<span className="text-cyan-600">doc</span></h2>
            <p className="text-[11px] text-slate-500 font-medium">Daily Outpatient Department (OPD)</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {tokenData.issuedTime}</p>
          </div>

          {/* Large Token Badge */}
          <div className="flex flex-col items-center justify-center py-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Token Number</span>
            <div className="mt-1 text-5xl font-black tracking-tight text-cyan-600 font-mono drop-shadow-xs">
              {tokenData.tokenCode || `T-${String(tokenData.tokenNumber).padStart(2, '0')}`}
            </div>
            
            {/* Priority Indicator */}
            <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${priorityMeta.badgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${priorityMeta.dotClass} animate-pulse`} />
              <span>{priorityMeta.iconText} {priorityMeta.label} Priority</span>
            </div>
          </div>

          {/* Patient & Doctor Details Card */}
          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Patient
              </span>
              <span className="font-bold text-slate-900 text-right">
                {tokenData.patientName || tokenData.patientSnapshot?.name || 'Patient'}{' '}
                {(tokenData.age || tokenData.patientSnapshot?.age) ? `(${tokenData.age || tokenData.patientSnapshot?.age}y/${(tokenData.gender || tokenData.patientSnapshot?.gender)?.[0] || '?'})` : ''}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Doctor
              </span>
              <span className="font-bold text-slate-800 text-right">{tokenData.doctorName}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Service
              </span>
              <span className="font-semibold text-indigo-700 text-right truncate max-w-[170px]">{tokenData.service || 'General Consultation'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Type</span>
              <span className="font-semibold text-slate-700">
                {tokenData.isNewPatient ? '🆕 New Walk-in' : '📂 Existing Patient'}
              </span>
            </div>
          </div>

          {/* Barcode & Notice */}
          <div className="text-center pt-2 space-y-1.5 border-t border-dashed border-slate-300">
            {/* Pseudo Barcode Representation */}
            <div className="flex justify-center items-center gap-0.5 h-7 px-4 opacity-75">
              {[4,2,6,1,3,5,2,4,7,1,3,2,6,4,2,5,3,1,4,6,2,3,5,2,4,1,3].map((w, idx) => (
                <div key={idx} className="bg-slate-800 h-full rounded-[1px]" style={{ width: `${w * 1.5}px` }} />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              {tokenData.id || `CLINIC-TOK-${tokenData.tokenNumber}`}
            </p>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Please be seated in the waiting area. You will be called when your token number appears on the display.
            </p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            Done
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Slip
          </button>
        </div>
      </div>
    </div>
  );
};
