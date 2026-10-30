import React, { useContext, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, Clock, CheckCircle2, CalendarDays, Plus,
  User, Stethoscope, Phone, MessageSquare, Edit2, Trash2, X, Send,
  AlertCircle, Filter, Calendar, Activity, Check, ArrowRight, ChevronRight
} from 'lucide-react';
import { ContextProvider } from '../../context/store';
import AppointmentForm from '../AppointmentForm';
import { AppointmentKpi } from './SharedKpis';
import { DataPageSkeleton } from '../DataPageSkeleton';

export default function FollowUp() {
  const navigate = useNavigate();
  const {
    Appointments: AppointmentsData,
    Patients,
    Doctors,
    setIsEditClick,
    isEditClick,
    setSelectedPatientData,
    selectedPatientData,
    AppointmentDelete,
    loading,
    hasPermission
  } = useContext(ContextProvider);
  const [click, setClick] = useState(false);

  const canManageFollowUp = hasPermission ? Boolean(hasPermission('MANAGE_FOLLOW_UP')) : false;
  const canEditFollowUp = hasPermission ? Boolean(hasPermission('EDIT_FOLLOW_UP')) : false;
  const canDeleteFollowUp = hasPermission ? Boolean(hasPermission('DELETE_FOLLOW_UP')) : false;

  // Safe normalized arrays from Context
  const appointmentsList = useMemo(() => {
    if (Array.isArray(AppointmentsData?.data)) return AppointmentsData.data;
    if (Array.isArray(AppointmentsData)) return AppointmentsData;
    return [];
  }, [AppointmentsData]);

  const patientsList = useMemo(() => {
    if (Array.isArray(Patients?.data)) return Patients.data;
    if (Array.isArray(Patients)) return Patients;
    return [];
  }, [Patients]);

  const doctorsList = useMemo(() => {
    if (Array.isArray(Doctors?.data)) return Doctors.data;
    if (Array.isArray(Doctors)) return Doctors;
    return [];
  }, [Doctors]);

  // Filtering for appointments where visit_type or status is Follow-up (case-insensitive)
  const followUpAppointments = useMemo(() => {
    return appointmentsList.filter((apt) => {
      const vType = (apt.visit_type || '').toLowerCase().trim();
      const sType = (apt.status || '').toLowerCase().trim();
      return (
        sType === 'follow-up' || sType === 'followup' || sType.includes('follow-up') || sType.includes('follow up') ||
        vType === 'follow-up' || vType === 'followup' || vType.includes('follow-up') || vType.includes('follow up')
      );
    });
  }, [appointmentsList]);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Scheduled, Completed, Cancelled
  const [doctorFilter, setDoctorFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // WhatsApp Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppRecipient, setWhatsAppRecipient] = useState(null);
  const [whatsAppMessage, setWhatsAppMessage] = useState('');

  // Name & Details Resolver Helpers
  const getPatientObj = (patientId) => {
    if (typeof patientId === 'object' && patientId !== null) return patientId;
    return patientsList.find(p => p._id === patientId || p.id === patientId) || null;
  };

  const getPatientName = (patientId) => {
    const p = getPatientObj(patientId);
    if (p) return p.full_name || p.name || 'Unknown Patient';
    return patientId || 'Unknown Patient';
  };

  const getDoctorObj = (doctorId) => {
    if (typeof doctorId === 'object' && doctorId !== null) return doctorId;
    return doctorsList.find(d => d._id === doctorId || d.id === doctorId) || null;
  };

  const getDoctorName = (doctorId) => {
    const d = getDoctorObj(doctorId);
    if (d) return d.full_name || d.name || 'Unknown Doctor';
    return doctorId || 'Unknown Doctor';
  };

  // KPI Calculations specifically for Follow-Up Appointments
  const total = followUpAppointments.length;
  const completed = followUpAppointments.filter(a => a.status === 'Completed').length;
  const scheduled = followUpAppointments.filter(a => a.status === 'Scheduled' || a.status === 'Pending').length;
  const cancelled = followUpAppointments.filter(a => a.status === 'Cancelled').length;
  const followUp = followUpAppointments.filter(a => a.status === 'Follow-up').length;

  // Filtered List based on Search and Dropdowns
  const filteredList = useMemo(() => {
    return followUpAppointments.filter((apt) => {
      const pName = getPatientName(apt.patient).toLowerCase();
      const dName = getDoctorName(apt.doctor).toLowerCase();
      const reason = (apt.reasonForVisit || apt.service || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || pName.includes(q) || dName.includes(q) || reason.includes(q);
      if (!matchesSearch) return false;

      if (statusFilter !== 'ALL' && apt.status !== statusFilter) return false;

      const docId = typeof apt.doctor === 'object' ? apt.doctor?._id : apt.doctor;
      if (doctorFilter !== 'ALL' && docId !== doctorFilter) return false;

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.date || '9999-12-31').getTime();
      const dateB = new Date(b.date || '9999-12-31').getTime();
      return dateA - dateB;
    });
  }, [followUpAppointments, searchQuery, statusFilter, doctorFilter, patientsList, doctorsList]);

  // Open WhatsApp Message Generator
  const handleOpenWhatsApp = (apt) => {
    const patientObj = getPatientObj(apt.patient);
    const pName = getPatientName(apt.patient);
    const dName = getDoctorName(apt.doctor);
    const phone = patientObj?.phone || patientObj?.contact_number || patientObj?.mobile || '';
    const dateFormatted = apt.date ? new Date(apt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'soon';
    const timeFormatted = apt.start_time ? ` at ${apt.start_time}` : '';

    const text = `Hello *${pName}*,\n\nThis is a friendly reminder for your upcoming *Follow-Up Appointment* at *Kydoc*:\n\n📅 *Date:* ${dateFormatted}${timeFormatted}\n👨‍⚕️ *Doctor:* Dr. ${dName}\n🩺 *Service:* ${apt.service || 'Follow-Up Checkup'}\n📝 *Reason:* ${apt.reasonForVisit || 'Review & Evaluation'}\n\nPlease let us know if you need to confirm or reschedule.\n\nThank you!`;

    setWhatsAppRecipient({ name: pName, phone: phone, service: apt.service || 'Follow-Up' });
    setWhatsAppMessage(text);
    setIsWhatsAppModalOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (!whatsAppRecipient) return;
    const phoneClean = (whatsAppRecipient.phone || '').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(whatsAppMessage);
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
    setIsWhatsAppModalOpen(false);
  };

  function handleEdit(apt) {
    console.log('Editing appointment :', apt);
    setSelectedPatientData(apt);
    setIsEditClick(true);
  }
  // Open Book Follow-up Form
  const handleBookFollowUp = () => {
    setSelectedPatientData(null);
    setIsEditClick(false);
    setClick(true);
  };

  if (loading?.appointments || loading?.patients || loading?.doctors) return <DataPageSkeleton kpis={3} />;

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto space-y-4 pb-28 sm:pb-32 md:pb-6">

      {/* 1. Header */}
      <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-gradient-to-b before:from-cyan-500 before:to-teal-600">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20 shrink-0">
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Follow-Up Appointments</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Tracking all patient appointments with visit type: <span className="font-bold text-cyan-700">Follow-up</span></p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Cards
            </button>
          </div>

          {canManageFollowUp && (
            <button
              onClick={handleBookFollowUp}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs shadow-cyan-600/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4" /> Book Follow-Up
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Cards (2-cols on mobile, 4-cols on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AppointmentKpi title="Total Follow-Ups" value={total.toString()} subtext="All follow-up visits" icon={CalendarDays} />
        <AppointmentKpi title="Scheduled" value={scheduled.toString()} subtext="Pending & Scheduled" icon={Clock} />
        <AppointmentKpi title="Completed" value={completed.toString()} subtext="Attended visits" icon={CheckCircle2} />
        <AppointmentKpi title="Cancelled" value={cancelled.toString()} subtext="Cancelled visits" icon={AlertCircle} />
      </div>

      {/* 3. Main Data Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col ring-1 ring-slate-100/70">

        {/* Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/80 flex flex-col gap-3 bg-slate-50/80">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between w-full">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by patient, doctor, service or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-medium shadow-2xs"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              {/* Status Filter (Desktop) */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="hidden md:block px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Statuses ({total})</option>
                <option value="Scheduled">Scheduled ({scheduled})</option>
                <option value="Completed">Completed ({completed})</option>
                <option value="Cancelled">Cancelled ({cancelled})</option>
                <option value="Follow-up">Follow-Up ({followUp})</option>
              </select>

              {/* Doctor Filter */}
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer shadow-2xs w-full md:w-auto"
              >
                <option value="ALL">All Doctors</option>
                {doctorsList.map(doc => (
                  <option key={doc._id} value={doc._id}>
                    Dr. {doc.full_name || doc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Quick Status Filter Chips */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full">
            {[
              { id: 'ALL', label: 'All', count: total },
              { id: 'Scheduled', label: 'Scheduled', count: scheduled },
              { id: 'Completed', label: 'Completed', count: completed },
              { id: 'Cancelled', label: 'Cancelled', count: cancelled },
              { id: 'Follow-up', label: 'Follow-Up', count: followUp }
            ].map((chip) => {
              const isSelected = statusFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setStatusFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>{chip.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Views */}
        {filteredList.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-100 shadow-sm">
              <CalendarDays className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Follow-Up Appointments Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' || doctorFilter !== 'ALL'
                ? 'No follow-up appointments match your active filters.'
                : 'There are currently no appointments with visit type "Follow-up".'}
            </p>
            <button
              onClick={handleBookFollowUp}
              className="mt-6 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer active:scale-95"
            >
              Book New Follow-Up
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Native App Cards (< 768px) */}
            <div className="md:hidden divide-y divide-slate-100 bg-slate-50/40 p-2.5 sm:p-3 space-y-2.5">
              {filteredList.map((apt) => {
                const patientObj = getPatientObj(apt.patient);
                const patientName = getPatientName(apt.patient);
                const doctorName = getDoctorName(apt.doctor);
                const phone = patientObj?.phone || patientObj?.contact_number || patientObj?.mobile || '';
                const initials = patientName
                  ? patientName.substring(0, 2).toUpperCase()
                  : "NA";
                const dateStr = apt.date ? new Date(apt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'No date';

                return (
                  <div
                    key={apt._id || Math.random()}
                    className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3"
                  >
                    {/* Top Row: Patient Avatar, Name & Status Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div 
                        onClick={() => navigate(`/appointments/${apt._id || apt.id}`, { state: { appointment: apt } })}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs shadow-cyan-600/20">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm capitalize truncate hover:text-cyan-600 transition-colors">
                            {patientName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mt-0.5">
                            <Stethoscope className="w-3 h-3 text-cyan-600 shrink-0" />
                            <span className="truncate">Dr. {doctorName}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                        apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        apt.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          apt.status === 'Completed' ? 'bg-emerald-600' :
                          apt.status === 'Cancelled' ? 'bg-rose-600' :
                          'bg-amber-600'
                        }`} />
                        {apt.status || 'Scheduled'}
                      </span>
                    </div>

                    {/* Middle Info Chips Row */}
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 font-bold text-slate-700 text-[11px]">
                        <CalendarDays className="w-3 h-3 text-slate-400" />
                        <span>{dateStr}</span>
                        {apt.start_time && <span className="text-slate-400 font-normal">({apt.start_time})</span>}
                      </div>

                      <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {apt.visit_type || 'Follow-up'}
                      </span>

                      {apt.service && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold truncate max-w-[130px]">
                          {apt.service}
                        </span>
                      )}
                    </div>

                    {/* Reason if available */}
                    {apt.reasonForVisit && (
                      <p className="text-[11px] text-slate-500 font-medium bg-slate-50/70 p-2 rounded-xl line-clamp-2">
                        {apt.reasonForVisit}
                      </p>
                    )}

                    {/* Quick Action Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Call Patient"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Call</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleOpenWhatsApp(apt)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                          title="WhatsApp Reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="text-[11px]">WhatsApp</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {canEditFollowUp && (
                          <button
                            onClick={() => handleEdit(apt)}
                            className="p-1.5 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-xl transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteFollowUp && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete follow-up appointment for ${patientName}?`)) {
                                AppointmentDelete(apt._id);
                              }
                            }}
                            className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Views (md+) */}
            <div className="hidden md:block flex-1">
              {viewMode === 'table' ? (
                /* TABLE VIEW */
                <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/80">
                  <th className="py-4 px-6 min-w-[220px]">Patient</th>
                  <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Date</th>
                  <th className="py-4 px-4 whitespace-nowrap min-w-[130px]">Time</th>
                  <th className="py-4 px-4 whitespace-nowrap min-w-[180px]">Doctor</th>
                  <th className="py-4 px-4 whitespace-nowrap min-w-[150px]">Visit Type / Service</th>
                  <th className="py-4 px-4 min-w-[220px]">Reason</th>
                  <th className="py-4 px-4 whitespace-nowrap min-w-[140px]">Status</th>
                  <th className="py-4 px-6 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredList.map((apt) => {
                  const patientObj = getPatientObj(apt.patient);
                  const patientName = getPatientName(apt.patient);
                  const doctorName = getDoctorName(apt.doctor);
                  const phone = patientObj?.phone || patientObj?.contact_number || patientObj?.mobile || '—';

                  return (
                    <tr key={apt._id || Math.random()} className="hover:bg-slate-50/70 transition-colors">
                      {/* Patient */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {patientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">{patientName}</div>
                            <div className="text-slate-400 text-xs font-medium">{phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-800">
                        {apt.date ? new Date(apt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>

                      {/* Time */}
                      <td className="py-4 px-4 whitespace-nowrap font-semibold text-slate-600">
                        {apt.start_time || apt.starttime || 'N/A'} {apt.end_time ? `- ${apt.end_time}` : ''}
                      </td>

                      {/* Doctor (guaranteed single line) */}
                      <td className="py-4 px-4 whitespace-nowrap font-extrabold text-slate-900">
                        Dr. {doctorName}
                      </td>

                      {/* Visit Type / Service */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block text-xs font-extrabold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-100/80 whitespace-nowrap">
                            {apt.visit_type || 'Follow-up'}
                          </span>
                          {apt.service && (
                            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                              ({apt.service})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-4 max-w-[260px] truncate text-slate-600 font-medium" title={apt.reasonForVisit}>
                        {apt.reasonForVisit || 'Follow-up consultation'}
                      </td>

                      {/* Status (guaranteed single line badge) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                          apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          apt.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            apt.status === 'Completed' ? 'bg-emerald-600' :
                            apt.status === 'Cancelled' ? 'bg-rose-600' :
                            'bg-amber-600'
                          }`} />
                          {apt.status || 'Scheduled'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* WhatsApp Reminder */}
                          <button
                            onClick={() => handleOpenWhatsApp(apt)}
                            className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all cursor-pointer border border-emerald-200 shadow-2xs"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          {canEditFollowUp && (
                            <button
                              onClick={() => handleEdit(apt)}
                              className="p-2 text-cyan-700 bg-cyan-50 hover:bg-cyan-600 hover:text-white rounded-xl transition-all cursor-pointer border border-cyan-200 shadow-2xs"
                              title="Edit Appointment"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {canDeleteFollowUp && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete this follow-up appointment for ${patientName}?`)) {
                                  AppointmentDelete(apt._id);
                                }
                              }}
                              className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer border border-rose-200 shadow-2xs"
                              title="Delete Appointment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARD GRID VIEW */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredList.map((apt) => {
              const patientObj = getPatientObj(apt.patient);
              const patientName = getPatientName(apt.patient);
              const doctorName = getDoctorName(apt.doctor);
              const phone = patientObj?.phone || patientObj?.contact_number || patientObj?.mobile || '—';
              const dateStr = apt.date ? new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No date';

              return (
                <div key={apt._id || Math.random()} className="bg-slate-50/50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase text-cyan-700 bg-cyan-50 border border-cyan-100 px-2.5 py-1 rounded-lg">
                        Follow-Up Visit
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        apt.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                        {apt.status || 'Scheduled'}
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white font-black flex items-center justify-center">
                        {patientName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{patientName}</h4>
                        <p className="text-xs text-slate-500 font-medium">{phone}</p>
                      </div>
                    </div>

                    {/* Details Box */}
                    <div className="mt-3 p-3 bg-white rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Doctor:</span>
                        <span className="font-bold text-slate-800">Dr. {doctorName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Date & Time:</span>
                        <span className="font-bold text-slate-800">{dateStr} ({apt.start_time || '—'})</span>
                      </div>
                      {apt.service && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold">Service:</span>
                          <span className="font-bold text-cyan-700">{apt.service}</span>
                        </div>
                      )}
                      {apt.reasonForVisit && (
                        <div className="pt-1 border-t border-slate-100">
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Reason:</span>
                          <p className="text-slate-600 text-xs font-medium line-clamp-2">{apt.reasonForVisit}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenWhatsApp(apt)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors cursor-pointer border border-emerald-200"
                      title="WhatsApp Reminder"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      {canEditFollowUp && (
                        <button
                          onClick={() => {
                            setSelectedPatientData(apt);
                            setIsEditClick(true);
                          }}
                          className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                      {canDeleteFollowUp && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete follow-up appointment for ${patientName}?`)) {
                              AppointmentDelete(apt._id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  )}

      </div>

      {/* Mobile Floating Action Button (FAB) */}
      {canManageFollowUp && (
        <button
          onClick={handleBookFollowUp}
          className="md:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-3.5 rounded-full shadow-lg shadow-cyan-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Book Follow-Up"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Appointment Edit/Create Modal */}
      {isEditClick && <AppointmentForm />}
      {click && <AppointmentForm isFollowUp={true} setClick={setClick} />}
      {/* WhatsApp Message Reminder Modal */}
      {isWhatsAppModalOpen && whatsAppRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Send Follow-Up Reminder</h3>
              </div>
              <button onClick={() => setIsWhatsAppModalOpen(false)} className="text-emerald-100 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block text-sm">{whatsAppRecipient.name}</span>
                  <span className="text-emerald-700 font-medium">{whatsAppRecipient.phone || 'No phone number'}</span>
                </div>
                <span className="px-2 py-1 bg-emerald-200 text-emerald-900 font-extrabold rounded-lg text-[10px] uppercase">
                  {whatsAppRecipient.service}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">WhatsApp Message:</label>
                <textarea
                  rows={8}
                  value={whatsAppMessage}
                  onChange={(e) => setWhatsAppMessage(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Open WhatsApp & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
