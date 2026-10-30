import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Stethoscope,
  Phone,
  PhoneCall,
  Mail,
  MailCheck,
  Calendar,
  Clock,
  Briefcase,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle2,
  Users,
  ChevronRight
} from 'lucide-react';
import { ContextProvider } from '../../context/store';
import { DataPageSkeleton } from '../DataPageSkeleton';
import { ROLES } from '../../utils/rbac';

export const DoctorDetail = ({ onEditDoctor }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { Doctors, Appointments, Patients, setIsEditClick, setSelectedPatientData, DoctorDelete, loading, userRole } = useContext(ContextProvider);

  const [doctor, setDoctor] = useState(location.state?.doctor || null);

  useEffect(() => {
    if (!doctor || String(doctor._id || doctor.id) !== String(id)) {
      const doctorsList = Array.isArray(Doctors?.data) ? Doctors.data : Array.isArray(Doctors) ? Doctors : [];
      const found = doctorsList.find((d) => String(d._id || d.id) === String(id));
      if (found) {
        setDoctor(found);
      }
    }
  }, [id, Doctors, doctor]);

  if (loading?.doctors && !doctor) {
    return <DataPageSkeleton />;
  }

  if (!doctor) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/doctors')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-cyan-700 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Doctors
        </button>
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <Stethoscope className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Doctor Not Found</h3>
          <p className="text-xs text-slate-500 mb-4">The doctor details you are looking for could not be found or have been deleted.</p>
          <button
            onClick={() => navigate('/doctors')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            Return to Doctors List
          </button>
        </div>
      </div>
    );
  }

  const initials = doctor.full_name
    ? doctor.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'DR';

  // Normalize working days
  let workingDays = [];
  if (Array.isArray(doctor.working_days)) {
    workingDays = doctor.working_days;
  } else if (typeof doctor.working_days === 'string' && doctor.working_days.trim()) {
    workingDays = doctor.working_days.split(',').map((d) => d.trim()).filter(Boolean);
  }

  // Calculate live shift status
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const toMinutes = (time) => {
    if (!time || !/^\d{1,2}:\d{2}/.test(time)) return null;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const start = toMinutes(doctor.shift_start_time);
  const end = toMinutes(doctor.shift_end_time);
  const isOnShift =
    String(doctor?.status || '').toLowerCase() === 'active' &&
    start !== null &&
    end !== null &&
    (start <= end
      ? currentMinutes >= start && currentMinutes <= end
      : currentMinutes >= start || currentMinutes <= end);

  const statusStyle = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    'on leave': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    inactive: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  };
  const doctorStatus = (doctor.status || 'Active').toLowerCase();
  const curStatus = statusStyle[doctorStatus] || statusStyle.active;

  // Filter linked appointments
  const allAppointments = Array.isArray(Appointments?.data) ? Appointments.data : Array.isArray(Appointments) ? Appointments : [];
  const doctorAppointments = allAppointments.filter((a) => {
    const dId = typeof a.doctor === 'object' ? (a.doctor?._id || a.doctor?.id) : a.doctor;
    return String(dId) === String(doctor._id || doctor.id);
  });

  // Filter linked patients
  const allPatients = Array.isArray(Patients?.data) ? Patients.data : Array.isArray(Patients) ? Patients : [];
  const doctorPatients = allPatients.filter((p) => {
    const docId = p.assigned_doctor_id;
    const docName = p.assigned_doctor_name;
    return String(docId) === String(doctor._id || doctor.id) || (docName && doctor.full_name && docName.toLowerCase() === doctor.full_name.toLowerCase());
  });

  const handleEdit = () => {
    setIsEditClick(true);
    setSelectedPatientData(doctor);
    if (onEditDoctor) onEditDoctor();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete Dr. ${doctor.full_name}?`)) {
      DoctorDelete(doctor._id || doctor.id);
      navigate('/doctors');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-28 md:pb-12">
      {/* Mobile Top App Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/doctors')}
          className="flex items-center gap-1.5 text-slate-700 hover:text-cyan-700 font-bold text-xs cursor-pointer transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Doctors</span>
          <span className="sm:hidden">Back</span>
        </button>

        <h1 className="text-sm font-black text-slate-900 tracking-tight">Doctor Profile</h1>

        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          #{(doctor._id || '').slice(-6)}
        </span>
      </div>

      <div className="p-3.5 sm:p-5 md:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-5">
        {/* Mobile-First Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center font-black text-xl sm:text-2xl shrink-0 shadow-md shadow-cyan-600/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight capitalize truncate">
                    Dr. {doctor.full_name}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                  <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-100 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3 text-cyan-600" />
                    {doctor.specialization || 'General Specialist'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${curStatus.bg} ${curStatus.text} ${curStatus.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${curStatus.dot}`} />
                    {doctor.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Row (Admin only) */}
          {userRole === ROLES.ADMIN && (
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-slate-100">
              <button
                onClick={handleEdit}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs shadow-cyan-600/20 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Doctor
              </button>
              <button
                onClick={handleDelete}
                className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Quick KPI Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Experience */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-cyan-600" /> Experience
            </div>
            <p className="text-base sm:text-xl font-black text-slate-900 mt-1">
              {doctor.experience_years ? `${doctor.experience_years} yrs` : 'N/A'}
            </p>
          </div>

          {/* Consultation Fee */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Fee
            </div>
            <p className="text-base sm:text-xl font-black text-slate-900 mt-1">
              {doctor.consultation_fee ? `₹${doctor.consultation_fee}` : 'Free'}
            </p>
          </div>

          {/* Shift Status */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Shift
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {isOnShift ? (
                <span className="text-xs sm:text-sm font-black text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> On Shift
                </span>
              ) : (
                <span className="text-xs sm:text-sm font-black text-slate-500">Off Shift</span>
              )}
            </div>
          </div>

          {/* Assigned Patients */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-blue-500" /> Patients
            </div>
            <p className="text-base sm:text-xl font-black text-slate-900 mt-1">
              {doctorPatients.length}
            </p>
          </div>
        </div>

        {/* Section: Contact & Credentials */}
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Contact & Credentials</h3>
            <Phone className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* Phone */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Phone</p>
                  <p className="font-extrabold text-slate-800 text-sm truncate">{doctor.phone || 'Not provided'}</p>
                </div>
              </div>
              {doctor.phone && (
                <a
                  href={`tel:${doctor.phone}`}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </a>
              )}
            </div>

            {/* Email */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Email</p>
                  <p className="font-extrabold text-slate-800 text-sm truncate">{doctor.email || 'Not provided'}</p>
                </div>
              </div>
              {doctor.email && (
                <a
                  href={`mailto:${doctor.email}`}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <MailCheck className="w-3.5 h-3.5" /> Email
                </a>
              )}
            </div>

            {/* Specialization Detail */}
            <div className="p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">Specialization Focus</p>
                <p className="font-semibold text-slate-800 text-xs mt-0.5 leading-relaxed">
                  {doctor.specialization || 'Dermatology & Skin Care'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Working Schedule & Hours */}
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Working Schedule</h3>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="p-4 space-y-3.5 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Shift Hours</p>
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                <Clock className="w-4 h-4 text-cyan-600" />
                <span>{doctor.shift_start_time || '09:00'} – {doctor.shift_end_time || '17:00'}</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Available Days</p>
              <div className="flex flex-wrap gap-1.5">
                {workingDays.length > 0 ? (
                  workingDays.map((day, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-lg"
                    >
                      {day}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-slate-500">Monday - Friday (Standard schedule)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Linked Patients */}
        {doctorPatients.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Assigned Patients ({doctorPatients.length})
              </h3>
              <Users className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="divide-y divide-slate-100">
              {doctorPatients.slice(0, 5).map((p) => (
                <div
                  key={p._id || p.id}
                  onClick={() => navigate(`/patients/${p._id || p.id}`, { state: { patient: p } })}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-cyan-50/40 active:bg-cyan-100/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {(p.full_name || 'P').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-cyan-700 transition-colors">
                        {p.full_name}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">{p.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default DoctorDetail;
