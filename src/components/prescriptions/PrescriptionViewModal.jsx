import React, { useContext } from 'react';
import { 
  X, Pill, Stethoscope, User, Calendar, Phone, Heart, 
  ShieldAlert, Activity, FileText, CheckCircle2, Clock, AlertCircle, 
  Sparkles, Tag, Printer, Layers, AlertTriangle, ArrowRight, MapPin, Droplet
} from 'lucide-react';
import { ContextProvider } from '../../context/store';
import { PrescriptionPrintModal } from './PrescriptionPrintModal';

export const PrescriptionViewModal = ({
  isOpen,
  onClose,
  prescription = null,
  onOpenPrint = null
}) => {
  const { Patients, Doctors } = useContext(ContextProvider) || {};

  if (!isOpen || !prescription) return null;

  const safePatients = Array.isArray(Patients) ? Patients : (Array.isArray(Patients?.data) ? Patients.data : []);
  const safeDoctors = Array.isArray(Doctors) ? Doctors : (Array.isArray(Doctors?.data) ? Doctors.data : []);

  // Resolve Patient Data
  const pId = typeof prescription.patientId === 'object' ? (prescription.patientId?._id || prescription.patientId?.id) : prescription.patientId;
  const foundP = safePatients.find((p) => String(p._id || p.id) === String(pId));
  const patient = foundP || (typeof prescription.patientId === 'object' ? prescription.patientId : null);

  const patientName = patient?.full_name || patient?.name || prescription.patientName || 'Patient';
  const patientAge = patient?.age || prescription.patientAge || '—';
  const patientGender = patient?.gender || prescription.patientGender || '—';
  const patientPhone = patient?.phone || prescription.patientPhone || 'No phone provided';
  const patientAddress = patient?.address || prescription.patientAddress || '—';
  const patientBlood = patient?.blood_group || prescription.patientBloodGroup || '—';

  // Resolve Doctor Data
  const dId = typeof prescription.doctorId === 'object' ? (prescription.doctorId?._id || prescription.doctorId?.id) : prescription.doctorId;
  const foundD = safeDoctors.find((d) => String(d._id || d.id) === String(dId));
  const doctor = foundD || (typeof prescription.doctorId === 'object' ? prescription.doctorId : null);

  const doctorName = doctor?.full_name || doctor?.name || prescription.doctorName || 'Dr. Assigned';
  const doctorSpec = doctor?.specialization || doctor?.department || 'Skin Care Practitioner';

  const rxNumber = prescription.prescriptionNumber || `RX-${(prescription._id || '').slice(-6).toUpperCase()}`;
  const rxDate = prescription.createdAt 
    ? new Date(prescription.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) 
    : new Date().toLocaleDateString();

  const status = (prescription.status || 'active').toLowerCase();
  const statusStyles = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    dispensed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    draft: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
    expired: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-500' }
  };
  const currentStatusStyle = statusStyles[status] || statusStyles.active;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Top Header Hero */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center backdrop-blur-md shadow-inner">
              <Pill className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Prescription Details
                </h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black border uppercase tracking-wider ${currentStatusStyle.bg} ${currentStatusStyle.text} ${currentStatusStyle.border} shadow-2xs`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentStatusStyle.dot}`} />
                  {status}
                </span>
              </div>
              <p className="text-xs text-cyan-200/90 font-medium mt-0.5 flex items-center gap-2">
                <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded-md text-cyan-100">{rxNumber}</span>
                <span>•</span>
                <span>Issued on {rxDate}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPrint && (
              <button
                onClick={onOpenPrint}
                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer border border-cyan-400/30"
              >
                <Printer className="w-4 h-4 text-cyan-300" /> Print Letterhead
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-slate-200 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Dashboard Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/60">
          
          {/* 1. Patient & Doctor Overview Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Patient Card (2 Cols) */}
            <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 font-black text-lg flex items-center justify-center border border-cyan-100">
                    {patientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
                      Patient
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">{patientName}</h3>
                  </div>
                </div>

                {patientBlood !== '—' && (
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-black flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 fill-rose-600 text-rose-600" /> Blood: {patientBlood}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Age / Gender</span>
                  <span className="font-extrabold text-slate-800">{patientAge} yrs / {patientGender}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Contact</span>
                  <span className="font-extrabold text-slate-800 truncate block">{patientPhone}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Address</span>
                  <span className="font-extrabold text-slate-800 truncate block">{patientAddress}</span>
                </div>
              </div>
            </div>

            {/* Prescribing Doctor Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  Prescribing Doctor
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{doctorName}</h3>
                    <p className="text-xs font-bold text-teal-700">{doctorSpec}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs flex items-center justify-between text-slate-500 font-semibold">
                <span>Authorized Digital Stamp</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* 2. Skin assessment, treatment areas, and vitals */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600" /> Clinical Assessment & Vitals
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Chief Complaint */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Chief Complaint</span>
                <p className="text-sm font-extrabold text-slate-900">
                  {prescription.chiefComplaint || 'None specified'}
                </p>
              </div>

              {/* Diagnosis */}
              <div className="p-3.5 bg-cyan-50/70 rounded-2xl border border-cyan-200/70">
                <span className="text-[10px] font-black text-cyan-800 uppercase tracking-wider block mb-1">Clinical Diagnosis</span>
                <p className="text-sm font-black text-cyan-900">
                  {Array.isArray(prescription.diagnosis) ? prescription.diagnosis.join(', ') : (prescription.diagnosis || 'Skin care consultation')}
                </p>
              </div>

              {/* Mapped treatment areas */}
              <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-200/70">
                <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider block mb-1">Treatment area IDs</span>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {prescription.toothNumbers && prescription.toothNumbers.length > 0 ? (
                    prescription.toothNumbers.map((tNum) => (
                      <span key={tNum} className="px-2.5 py-0.5 bg-white text-teal-800 font-black text-xs rounded-lg border border-teal-200 shadow-2xs">
                        Area {tNum}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-bold text-slate-500">General Arch</span>
                  )}
                </div>
              </div>
            </div>

            {/* Vitals Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100">
                <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Allergies
                </span>
                <span className="font-extrabold text-rose-900 text-xs mt-0.5 block">
                  {Array.isArray(prescription.patientAllergiesSnapshot) && prescription.patientAllergiesSnapshot.length > 0
                    ? prescription.patientAllergiesSnapshot.join(', ')
                    : 'None Known'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Blood Pressure</span>
                <span className="font-black text-slate-800 text-sm block mt-0.5">
                  {prescription.vitalsSnapshot?.bloodPressure || '120/80 mmHg'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pulse Rate</span>
                <span className="font-black text-slate-800 text-sm block mt-0.5">
                  {prescription.vitalsSnapshot?.pulseRate || '72 bpm'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Weight</span>
                <span className="font-black text-slate-800 text-sm block mt-0.5">
                  {prescription.vitalsSnapshot?.weight || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Prescribed Medications Cards List */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4 text-cyan-600" /> Prescribed Medications ({(prescription.medications || []).length})
              </h4>
              <span className="text-[11px] font-bold text-slate-400">
                Complete Dosage & Timing Breakdown
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {(prescription.medications || []).map((m, idx) => (
                <div 
                  key={idx}
                  className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Med name, generic, instructions */}
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-black text-slate-900 text-sm">{m.medicineName}</h5>
                        <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-md text-[11px] font-black border border-cyan-200">
                          {m.dosageForm || 'Tablet'} {m.strength ? `(${m.strength})` : ''}
                        </span>
                      </div>
                      {m.genericName && (
                        <p className="text-[11px] text-slate-500 font-medium italic mt-0.5">
                          Generic: {m.genericName}
                        </p>
                      )}
                      {m.instructions && (
                        <p className="text-xs text-cyan-700 font-bold mt-1 bg-cyan-50/80 px-2.5 py-1 rounded-lg border border-cyan-100 inline-block">
                          Note: {m.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Badges for Frequency, Timing, Duration, Qty */}
                  <div className="flex items-center gap-2 flex-wrap md:justify-end">
                    {/* Frequency */}
                    <div className="px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-center">
                      <span className="text-[9px] font-black uppercase text-teal-500 block leading-tight">Frequency</span>
                      <span className="text-xs font-black text-teal-800">{m.frequency}</span>
                    </div>

                    {/* Meal Timing */}
                    <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <span className="text-[9px] font-black uppercase text-amber-500 block leading-tight">Timing</span>
                      <span className="text-xs font-black text-amber-800">{m.timing}</span>
                    </div>

                    {/* Duration */}
                    <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                      <span className="text-[9px] font-black uppercase text-emerald-500 block leading-tight">Duration</span>
                      <span className="text-xs font-black text-emerald-800">{m.duration?.value || 5} {m.duration?.unit || 'Days'}</span>
                    </div>

                    {/* Quantity */}
                    {m.quantity && (
                      <div className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-center">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block leading-tight">Qty</span>
                        <span className="text-xs font-black text-white">{m.quantity}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Advice & Next Appointment Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Advice */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-600" /> Care Advice & Instructions
              </span>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {prescription.generalAdvice || 'Maintain proper oral hygiene. Avoid hot and hard foods.'}
              </p>

              {prescription.diagnosticTestsAdvised && prescription.diagnosticTestsAdvised.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Diagnostic Tests Advised:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {prescription.diagnosticTestsAdvised.map((test, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs border border-slate-200">
                        {test}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Next Visit / Follow-up */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" /> Next Follow-Up Schedule
                </span>

                {prescription.followUpDate ? (
                  <div className="mt-3 p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl border border-cyan-200/70">
                    <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">Scheduled Date</span>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      {new Date(prescription.followUpDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {prescription.followUpInstructions && (
                      <p className="text-xs text-slate-600 font-semibold mt-1">
                        Purpose: {prescription.followUpInstructions}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-medium mt-3 italic">
                    No follow-up visit scheduled.
                  </p>
                )}
              </div>

              <div className="text-[11px] text-slate-400 font-semibold mt-3">
                Created: {prescription.createdAt ? new Date(prescription.createdAt).toLocaleString() : '—'}
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-semibold">
            Prescription Record ID: <span className="font-mono text-slate-700 font-bold">{prescription._id || prescription.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPrint && (
              <button
                type="button"
                onClick={onOpenPrint}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Letterhead
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close View
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
