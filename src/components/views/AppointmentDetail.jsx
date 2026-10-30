import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Phone,
  PhoneCall,
  Mail,
  MailCheck,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ContextProvider } from '../../context/store';
import { DataPageSkeleton } from '../DataPageSkeleton';
import AppointmentForm from '../AppointmentForm';

export const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    Appointments,
    Patients,
    Doctors,
    setIsEditClick,
    setSelectedPatientData,
    AppointmentDelete,
    isEditClick,
    loading,
    hasPermission
  } = useContext(ContextProvider);

  const canEditAppointment = hasPermission ? Boolean(hasPermission('EDIT_APPOINTMENT')) : false;
  const canCancelAppointment = hasPermission ? Boolean(hasPermission('CANCEL_APPOINTMENT')) : false;

  const [appointment, setAppointment] = useState(location.state?.appointment || null);

  useEffect(() => {
    if (!appointment || String(appointment._id || appointment.id) !== String(id)) {
      const allAppts = Array.isArray(Appointments?.data) ? Appointments.data : Array.isArray(Appointments) ? Appointments : [];
      const found = allAppts.find((a) => String(a._id || a.id) === String(id));
      if (found) {
        setAppointment(found);
      }
    }
  }, [id, Appointments, appointment]);

  if (loading?.appointments && !appointment) {
    return <DataPageSkeleton />;
  }

  if (!appointment) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/appointments')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-cyan-700 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Appointments
        </button>
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Appointment Not Found</h3>
          <p className="text-xs text-slate-500 mb-4">The appointment details could not be found or have been deleted.</p>
          <button
            onClick={() => navigate('/appointments')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            Return to Appointments List
          </button>
        </div>
      </div>
    );
  }

  // Resolve linked Patient
  const patientsList = Array.isArray(Patients?.data) ? Patients.data : Array.isArray(Patients) ? Patients : [];
  const pId = typeof appointment.patient === 'object' ? appointment.patient?._id || appointment.patient?.id : appointment.patient;
  const linkedPatient = patientsList.find((p) => String(p._id || p.id) === String(pId)) || (typeof appointment.patient === 'object' ? appointment.patient : null);

  const patientName = linkedPatient?.full_name || linkedPatient?.name || (typeof appointment.patient === 'string' ? appointment.patient : 'Patient');
  const patientInitials = patientName ? patientName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'PT';

  // Resolve linked Doctor
  const doctorsList = Array.isArray(Doctors?.data) ? Doctors.data : Array.isArray(Doctors) ? Doctors : [];
  const dId = typeof appointment.doctor === 'object' ? appointment.doctor?._id || appointment.doctor?.id : appointment.doctor;
  const linkedDoctor = doctorsList.find((d) => String(d._id || d.id) === String(dId)) || (typeof appointment.doctor === 'object' ? appointment.doctor : null);

  const doctorName = linkedDoctor?.full_name || linkedDoctor?.name || (typeof appointment.doctor === 'string' ? appointment.doctor : 'Doctor');

  // Format dates & times
  const formattedDate = appointment.date && !Number.isNaN(new Date(appointment.date).getTime())
    ? new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not specified';

  const timeString = [
    appointment.start_time || appointment.starttime,
    appointment.end_time || appointment.endtime
  ].filter(Boolean).join(' - ') || 'Time not specified';

  // Status style
  const statusStyles = {
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    scheduled: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
    pending: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  };
  const curStatus = statusStyles[(appointment.status || 'scheduled').toLowerCase()] || statusStyles.scheduled;

  const handleEdit = () => {
    setSelectedPatientData(appointment);
    setIsEditClick(true);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this appointment for ${patientName}?`)) {
      AppointmentDelete(appointment._id || appointment.id);
      navigate('/appointments');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-28 md:pb-12">
      {/* Mobile Top App Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/appointments')}
          className="flex items-center gap-1.5 text-slate-700 hover:text-cyan-700 font-bold text-xs cursor-pointer transition-colors p-1 -ml-1 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Appointments</span>
          <span className="sm:hidden">Back</span>
        </button>

        <h1 className="text-sm font-black text-slate-900 tracking-tight">Appointment Details</h1>

        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          #{(appointment._id || '').slice(-6)}
        </span>
      </div>

      <div className="p-3.5 sm:p-5 md:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-5">
        {/* Mobile-First Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center font-black text-xl sm:text-2xl shrink-0 shadow-md shadow-cyan-600/20">
                {patientInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight capitalize truncate">
                    {patientName}
                  </h2>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                  <span>Assigned Doctor:</span>
                  <span className="font-bold text-cyan-700">Dr. {doctorName}</span>
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                  <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-100">
                    {appointment.service || appointment.visit_type || 'Consultation'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${curStatus.bg} ${curStatus.text} ${curStatus.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${curStatus.dot}`} />
                    {appointment.status || 'Scheduled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          {(canEditAppointment || canCancelAppointment) && (
            <div className={`grid ${canEditAppointment && canCancelAppointment ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 mt-4 pt-3.5 border-t border-slate-100`}>
              {canEditAppointment && (
                <button
                  onClick={handleEdit}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs shadow-cyan-600/20 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Appointment
                </button>
              )}
              {canCancelAppointment && (
                <button
                  onClick={handleDelete}
                  className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick KPI Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Date */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" /> Date
            </div>
            <p className="text-xs sm:text-base font-black text-slate-900 mt-1 truncate">
              {appointment.date ? new Date(appointment.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </p>
          </div>

          {/* Time */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Time
            </div>
            <p className="text-xs sm:text-base font-black text-slate-900 mt-1 truncate">
              {appointment.start_time || appointment.starttime || 'N/A'}
            </p>
          </div>

          {/* Service */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Service
            </div>
            <p className="text-xs sm:text-base font-black text-slate-900 mt-1 truncate">
              {appointment.service || 'Consultation'}
            </p>
          </div>

          {/* Visit Type */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-purple-500" /> Type
            </div>
            <p className="text-xs sm:text-base font-black text-slate-900 mt-1 truncate">
              {appointment.visit_type || 'Regular Visit'}
            </p>
          </div>
        </div>

        {/* Section: Patient Details */}
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Patient Details</h3>
            <User className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  {patientInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Patient Name</p>
                  <p className="font-extrabold text-slate-800 text-sm truncate">{patientName}</p>
                </div>
              </div>
              {linkedPatient?._id && (
                <button
                  onClick={() => navigate(`/patients/${linkedPatient._id}`, { state: { patient: linkedPatient } })}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                >
                  View Profile <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Phone */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Phone</p>
                  <p className="font-extrabold text-slate-800 text-sm truncate">
                    {linkedPatient?.phone || 'Not available'}
                  </p>
                </div>
              </div>
              {linkedPatient?.phone && (
                <a
                  href={`tel:${linkedPatient.phone}`}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </a>
              )}
            </div>

            {/* Email */}
            {linkedPatient?.email && (
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Email</p>
                    <p className="font-extrabold text-slate-800 text-sm truncate">{linkedPatient.email}</p>
                  </div>
                </div>
                <a
                  href={`mailto:${linkedPatient.email}`}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <MailCheck className="w-3.5 h-3.5" /> Email
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Section: Doctor Details */}
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Assigned Doctor</h3>
            <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Doctor</p>
                  <p className="font-extrabold text-slate-800 text-sm truncate">Dr. {doctorName}</p>
                  {linkedDoctor?.specialization && (
                    <p className="text-[11px] text-slate-500 font-medium">{linkedDoctor.specialization}</p>
                  )}
                </div>
              </div>
              {linkedDoctor?._id && (
                <button
                  onClick={() => navigate(`/doctors/${linkedDoctor._id}`, { state: { doctor: linkedDoctor } })}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                >
                  View Profile <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {linkedDoctor?.phone && (
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Contact</p>
                    <p className="font-extrabold text-slate-800 text-sm truncate">{linkedDoctor.phone}</p>
                  </div>
                </div>
                <a
                  href={`tel:${linkedDoctor.phone}`}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Section: Schedule & Service Info */}
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Schedule Information</h3>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Appointment Date</span>
                <span className="font-extrabold text-slate-800 text-sm">{formattedDate}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Timing</span>
                <span className="font-extrabold text-slate-800 text-sm">{timeString}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Reason for Visit / Clinical Notes */}
        {(appointment.reasonForVisit || appointment.notes) && (
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Reason for Visit / Notes</h3>
              <FileText className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="p-4">
              <p className="text-xs font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                {appointment.reasonForVisit || appointment.notes}
              </p>
            </div>
          </div>
        )}
      </div>

      {isEditClick && <AppointmentForm />}
    </div>
  );
};
export default AppointmentDetail;
