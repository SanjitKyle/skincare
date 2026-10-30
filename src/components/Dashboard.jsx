import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  FileText,
  UsersRound,
  Stethoscope,
  Clock,
  ShieldCheck,
  HeartPulse,
  Plus,
  ArrowRight,
  TrendingUp,
  Ticket,
  Receipt,
  Truck,
  Activity,
  CheckCircle2,
  CalendarCheck,
  UserPlus,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  AlertCircle,
  ExternalLink,
  Flame,
  Check,
  UserCheck
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ContextProvider } from '../context/store';
import { ROLES } from '../utils/rbac';
import { loadQueueFromStorage, QUEUE_STATUS } from '../services/queueStorage';
import { ScrollTriggerText, ScrollReveal } from './common/ScrollTriggerText';

const asList = (value) => (Array.isArray(value?.data) ? value.data : Array.isArray(value) ? value : []);

const formatDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Recently added';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const dateParts = (value) => {
  const date = value && !Number.isNaN(new Date(value).getTime()) ? new Date(value) : null;
  return date
    ? { day: date.getDate(), month: date.toLocaleDateString('en-US', { month: 'short' }) }
    : { day: '--', month: 'TBA' };
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />
);

// ─── Modern High-Impact KPI Card ─────────────────────────────────────────────
const KpiCard = ({ title, value, subtext, icon: Icon, loading, iconBg, trendText, trendUp, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between ${
      onClick ? 'cursor-pointer hover:border-cyan-300' : ''
    }`}
  >
    <div className="flex justify-between items-start gap-2">
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-20 mt-2" />
        ) : (
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 group-hover:text-cyan-600 transition-colors">
            {value}
          </h3>
        )}
      </div>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>

    <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
      {loading ? (
        <Skeleton className="h-3 w-28" />
      ) : (
        <>
          <p className="text-[11px] font-semibold text-slate-500 truncate">{subtext}</p>
          {trendText && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {trendText}
            </span>
          )}
        </>
      )}
    </div>
  </div>
);

// ─── Modern Card Panel ────────────────────────────────────────────────────────
const Panel = ({ title, subtitle, icon: Icon, children, loading, action }) => (
  <section className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-xs ring-1 ring-slate-100/60">
    <div className="flex items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-100">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <ScrollTriggerText
            as="h2"
            text={title}
            className="text-sm sm:text-base font-black text-slate-900 tracking-tight"
          />
          {subtitle && <p className="text-[11px] font-medium text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    {loading ? (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-14 w-full" />
        ))}
      </div>
    ) : (
      children
    )}
  </section>
);

// ─── Status badge helper ──────────────────────────────────────────────────────
const getStatusBadge = (status = '') => {
  const s = String(status).toLowerCase();
  if (s === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'scheduled' || s === 'confirmed') return 'bg-sky-50 text-sky-700 border-sky-200';
  if (s === 'in-progress' || s === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s === 'cancelled') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

// ─── Appointment Rows ─────────────────────────────────────────────────────────
const AppointmentRows = ({ appointments, patients, doctors, resolveName, emptyMessage, onSelect }) => {
  if (!appointments.length) {
    return (
      <div className="py-8 text-center">
        <CalendarCheck className="w-9 h-9 text-slate-300 mx-auto mb-2" />
        <p className="text-xs sm:text-sm font-semibold text-slate-600">{emptyMessage}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">New scheduled visits will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {appointments.map((item) => {
        const date = dateParts(item.date);
        const patientName = resolveName(item.patient, patients, 'Unknown patient');
        const doctorName = resolveName(item.doctor, doctors, 'Assigned doctor');
        const statusCls = getStatusBadge(item.status);

        return (
          <div
            key={item._id || item.id}
            onClick={() => onSelect && onSelect(item)}
            className="group flex items-center gap-3 sm:gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-cyan-200 p-2.5 sm:p-3 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
          >
            {/* Date Box */}
            <div className="w-11 sm:w-12 shrink-0 overflow-hidden rounded-xl border border-cyan-100 bg-white text-center shadow-2xs group-hover:scale-105 transition-transform">
              <p className="bg-gradient-to-r from-cyan-600 to-teal-600 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white">
                {date.month}
              </p>
              <p className="py-1 text-sm sm:text-base font-black leading-none text-slate-800">{date.day}</p>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate group-hover:text-cyan-600 transition-colors">
                  {patientName}
                </p>
                <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full border ${statusCls}`}>
                  {item.status || 'Scheduled'}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-xs">
                <span className="truncate text-slate-500 font-medium text-[11px]">Dr. {doctorName}</span>
                <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                <span className="rounded-md bg-cyan-50 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-bold text-cyan-800 border border-cyan-100/80 truncate">
                  {item.service || item.visit_type || 'Consultation'}
                </span>
              </div>
            </div>

            {/* Time */}
            <div className="shrink-0 text-right">
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                <Clock className="w-3 h-3 text-cyan-600" />
                <span>{item.start_time || item.starttime || '10:00 AM'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── MAIN DASHBOARD COMPONENT ────────────────────────────────────────────────
const Dashboard = ({ onAddPatient, onAddDoctor }) => {
  const navigate = useNavigate();
  const {
    Patients,
    Doctors,
    Appointments,
    Prescriptions,
    dashboardLoading,
    setSelectedPatientData,
    userRole,
    currentUser,
    hasPermission
  } = useContext(ContextProvider);

  const [appointmentTab, setAppointmentTab] = useState('upcoming');
  const [waitingCount, setWaitingCount] = useState(0);

  // Sync live waiting count from queue
  useEffect(() => {
    const syncCount = () => {
      try {
        const q = loadQueueFromStorage();
        const count = q.filter((i) => i.status === QUEUE_STATUS.WAITING).length;
        setWaitingCount(count);
      } catch (e) {
        setWaitingCount(0);
      }
    };
    syncCount();
    window.addEventListener('clinicQueueUpdated', syncCount);
    return () => window.removeEventListener('clinicQueueUpdated', syncCount);
  }, []);

  const patients = asList(Patients);
  const doctors = asList(Doctors);
  const appointments = asList(Appointments);
  const prescriptions = asList(Prescriptions);

  const resolveName = (value, list, fallback) => {
    if (typeof value === 'object' && value) return value.full_name || value.name || fallback;
    return list.find((item) => String(item._id || item.id) === String(value))?.full_name || fallback;
  };

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: Sun, pill: 'Morning Session' };
    if (hour < 17) return { text: 'Good afternoon', icon: Coffee, pill: 'Afternoon Shift' };
    return { text: 'Good evening', icon: Moon, pill: 'Evening Hours' };
  }, []);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const dashboard = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const isFollowUp = (item) =>
      String(item.status || '').toLowerCase() === 'follow-up' ||
      String(item.visit_type || '').toLowerCase() === 'follow-up';

    const upcoming = appointments
      .filter((item) => {
        const status = String(item.status || 'Scheduled').toLowerCase();
        const aptDate = new Date(item.date || item.createdAt);
        const isUpcoming = aptDate >= startOfToday;
        return !isFollowUp(item) && isUpcoming && (status === 'scheduled' || status === 'pending' || status === 'confirmed');
      })
      .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt))
      .slice(0, 5);

    const completed = appointments
      .filter((item) => String(item.status || '').toLowerCase() === 'completed')
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5);

    const recentPatients = [...patients]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    const statuses = appointments.reduce((result, item) => {
      const status = item.status || 'Scheduled';
      result[status] = (result[status] || 0) + 1;
      return result;
    }, {});

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
      return {
        label: date.toLocaleDateString(undefined, { month: 'short' }),
        count: 0,
        key: `${date.getFullYear()}-${date.getMonth()}`
      };
    });

    appointments.forEach((item) => {
      const date = new Date(item.date || item.createdAt);
      const month = months.find((entry) => entry.key === `${date.getFullYear()}-${date.getMonth()}`);
      if (month) month.count += 1;
    });

    return { upcoming, completed, recentPatients, statuses, months };
  }, [appointments, patients]);

  const totalStatus = Math.max(appointments.length, 1);

  // Quick Action Navigation Tiles
  const quickActions = useMemo(() => {
    const list = [
      {
        id: 'queue',
        label: 'Live Queue & Tokens',
        shortLabel: 'Queue',
        desc: 'Patient Waiting Room',
        icon: Ticket,
        path: '/queue',
        badge: `${waitingCount} Waiting`,
        color: 'hover:border-cyan-500 bg-cyan-50/60 text-cyan-800',
        allowed: !userRole || userRole === ROLES.ADMIN || userRole === ROLES.DOCTOR || (hasPermission && hasPermission('VIEW_QUEUE')),
      },
      {
        id: 'appointments',
        label: 'Appointment Calendar',
        shortLabel: 'Appts',
        desc: 'Consultations & Schedule',
        icon: Calendar,
        path: '/appointments',
        badge: `${dashboard.upcoming.length} Next`,
        color: 'hover:border-sky-500 bg-sky-50/60 text-sky-800',
        allowed: !userRole || userRole === ROLES.ADMIN || userRole === ROLES.DOCTOR || (hasPermission && hasPermission('VIEW_APPOINTMENTS')),
      },
      {
        id: 'patients',
        label: 'Patient Records',
        shortLabel: 'Patients',
        desc: 'Skin care client roster',
        icon: UsersRound,
        path: '/patients',
        badge: `${patients.length} Registered`,
        color: 'hover:border-cyan-500 bg-cyan-50/60 text-cyan-800',
        allowed: !userRole || userRole === ROLES.ADMIN || userRole === ROLES.DOCTOR || (hasPermission && hasPermission('VIEW_PATIENTS')),
      },
      {
        id: 'billing',
        label: 'Invoices & Billing',
        shortLabel: 'Billing',
        desc: 'Payments & Receipts',
        icon: Receipt,
        path: '/billing',
        badge: 'Accounts',
        color: 'hover:border-emerald-500 bg-emerald-50/60 text-emerald-800',
        allowed: !userRole || userRole === ROLES.ADMIN || (hasPermission && hasPermission('VIEW_BILLING')),
      },
      {
        id: 'lab_tracker',
        label: 'Products & Supplies',
        shortLabel: 'Supplies',
        desc: 'Skin care products and clinic supplies',
        icon: Truck,
        path: '/lab-tracker',
        badge: 'Lab Logistics',
        color: 'hover:border-amber-500 bg-amber-50/60 text-amber-800',
        allowed: !userRole || userRole === ROLES.ADMIN || userRole === ROLES.DOCTOR || (hasPermission && hasPermission('VIEW_LAB_TRACKER')),
      },
    ];
    return list.filter((item) => item.allowed);
  }, [userRole, hasPermission, dashboard.upcoming.length, patients.length, waitingCount]);

  // Role customized headers and configurations
  const roleConfig = useMemo(() => {
    switch (userRole) {
      case ROLES.DOCTOR:
        return {
          title: `Doctor Workspace`,
          subtitle: `Here is your schedule, clinical consultations, and active patient queue for today.`,
          canAddDoctor: false,
          canAddPatient: true,
          kpi1: {
            title: 'Assigned Patients',
            value: patients.length,
            subtext: 'Registered under clinic',
            icon: UsersRound,
            iconBg: 'bg-cyan-50 text-cyan-700',
            trendText: 'Roster',
            onClick: () => navigate('/patients')
          },
          kpi2: {
            title: 'Prescriptions Issued',
            value: prescriptions.length,
            subtext: 'Active clinical records',
            icon: FileText,
            iconBg: 'bg-purple-50 text-purple-700',
            trendText: 'Rx Log'
          },
          kpi3: {
            title: 'Upcoming Consults',
            value: dashboard.upcoming.length,
            subtext: 'Scheduled for today & future',
            icon: Calendar,
            iconBg: 'bg-teal-50 text-teal-700',
            trendText: 'Live',
            trendUp: true,
            onClick: () => navigate('/appointments')
          },
          kpi4: {
            title: 'Completed Visits',
            value: dashboard.completed.length,
            subtext: 'Finished appointment records',
            icon: Clock,
            iconBg: 'bg-emerald-50 text-emerald-700',
            trendText: 'Done',
            trendUp: true
          },
        };
      case ROLES.STAFF:
        const canStaffAddPatient = hasPermission ? Boolean(hasPermission('CREATE_PATIENT')) : false;
        return {
          title: `Front Desk & Clinic Operations`,
          subtitle: `Reception check-in hub, patient appointments, and daily OPD token management.`,
          canAddDoctor: false,
          canAddPatient: canStaffAddPatient,
          kpi1: {
            title: 'Total Patients',
            value: patients.length,
            subtext: 'Registered clinic profiles',
            icon: UsersRound,
            iconBg: 'bg-cyan-50 text-cyan-700',
            trendText: 'Registry',
            onClick: () => navigate('/patients')
          },
          kpi2: {
            title: 'Upcoming Consultations',
            value: dashboard.upcoming.length,
            subtext: 'Awaiting doctor visit',
            icon: Calendar,
            iconBg: 'bg-teal-50 text-teal-700',
            trendText: 'Today',
            trendUp: true,
            onClick: () => navigate('/appointments')
          },
          kpi3: {
            title: 'Total Appointments',
            value: appointments.length,
            subtext: `${dashboard.statuses.Scheduled || 0} scheduled`,
            icon: Clock,
            iconBg: 'bg-sky-50 text-sky-700',
            trendText: 'All-Time'
          },
          kpi4: {
            title: 'Completed Appointments',
            value: dashboard.completed.length,
            subtext: 'Check-outs completed',
            icon: CheckCircle2,
            iconBg: 'bg-emerald-50 text-emerald-700',
            trendText: 'Fulfilled',
            trendUp: true
          },
        };
      case ROLES.PATIENT:
        return {
          title: `Patient Health Portal`,
          subtitle: `Welcome back, ${currentUser?.name || 'Patient'}! Access your visits, doctor prescriptions, and medical records.`,
          canAddDoctor: false,
          canAddPatient: false,
          kpi1: {
            title: 'My Appointments',
            value: appointments.length,
            subtext: 'Booked consultations',
            icon: Calendar,
            iconBg: 'bg-teal-50 text-teal-700',
            trendText: 'Visits',
            onClick: () => navigate('/appointments')
          },
          kpi2: {
            title: 'My Prescriptions',
            value: prescriptions.length,
            subtext: 'Doctor medications',
            icon: FileText,
            iconBg: 'bg-purple-50 text-purple-700',
            trendText: 'Rx'
          },
          kpi3: {
            title: 'Specialist Doctors',
            value: doctors.length,
            subtext: 'Available clinicians',
            icon: Stethoscope,
            iconBg: 'bg-slate-100 text-slate-700',
            trendText: 'Available'
          },
          kpi4: {
            title: 'Coverage & Status',
            value: 'Verified',
            subtext: 'Clinical profile active',
            icon: ShieldCheck,
            iconBg: 'bg-emerald-50 text-emerald-700',
            trendText: 'Active',
            trendUp: true
          },
        };
      case ROLES.ADMIN:
      default:
        return {
          title: `Clinic Executive Dashboard`,
          subtitle: `A real-time overview of clinic operations, schedules, medical team, and patient flow.`,
          canAddDoctor: true,
          canAddPatient: true,
          kpi1: {
            title: 'Medical Specialists',
            value: doctors.length,
            subtext: 'Registered clinical team',
            icon: Stethoscope,
            iconBg: 'bg-cyan-50 text-cyan-700',
            trendText: 'Doctors',
            onClick: () => navigate('/doctors')
          },
          kpi2: {
            title: 'Prescriptions',
            value: prescriptions.length,
            subtext: 'Clinical pharmacy records',
            icon: FileText,
            iconBg: 'bg-purple-50 text-purple-700',
            trendText: 'Orders'
          },
          kpi3: {
            title: 'Upcoming Consults',
            value: dashboard.upcoming.length,
            subtext: `${dashboard.statuses.Scheduled || 0} scheduled`,
            icon: Calendar,
            iconBg: 'bg-teal-50 text-teal-700',
            trendText: 'Live Agenda',
            trendUp: true,
            onClick: () => navigate('/appointments')
          },
          kpi4: {
            title: 'Total Patients',
            value: patients.length,
            subtext: 'Registered in database',
            icon: UsersRound,
            iconBg: 'bg-cyan-50 text-cyan-700',
            trendText: '+Growth',
            trendUp: true,
            onClick: () => navigate('/patients')
          },
        };
    }
  }, [userRole, currentUser, doctors.length, prescriptions.length, appointments.length, patients.length, dashboard, navigate, hasPermission]);

  const handlePatientSelect = (patient) => {
    if (setSelectedPatientData) setSelectedPatientData(patient);
    navigate(`/patients/${patient._id || patient.id}`, { state: { patient } });
  };

  const handleAppointmentSelect = (item) => {
    navigate(`/appointments/${item._id || item.id}`, { state: { appointment: item } });
  };

  const GreetingIcon = greeting.icon;

  const initials = currentUser?.name
    ? currentUser.name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : 'DA';

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 📱 1. MOBILE DEVICE EXPERIENCE (For Phones Only: < md)                    */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-3.5">
        {/* Mobile Top Greeting App Bar */}
        <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-cyan-700 text-white flex items-center justify-center font-black text-sm shadow-md shadow-cyan-600/20 shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">
                  {greeting.text} 👋
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <ScrollTriggerText
                as="h2"
                text={currentUser?.name || (userRole === ROLES.ADMIN ? 'Clinic Admin' : 'Clinic User')}
                className="text-base font-black text-slate-900 truncate tracking-tight"
                delay={0.05}
              />
              <p className="text-[10px] font-semibold text-slate-400">
                {todayFormatted}
              </p>
            </div>
          </div>

          {/* Quick Add Patient Modal Button */}
          {roleConfig.canAddPatient && (
            <button
              onClick={() => {
                if (setSelectedPatientData) setSelectedPatientData(null);
                onAddPatient();
              }}
              className="p-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl shadow-xs shadow-cyan-600/20 active:scale-95 transition-transform cursor-pointer shrink-0"
              title="Add New Patient"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Live OPD Waiting Queue Card */}
        <div 
          onClick={() => navigate('/queue')}
          className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white p-3.5 rounded-2xl shadow-sm border border-slate-800 cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                    Live Waiting Room
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                  {waitingCount > 0 ? `${waitingCount} Patients in Waiting Queue` : `Queue Running Smoothly`}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 backdrop-blur-xs shrink-0">
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Mobile App Modules Grid (Clean 4-column native app launcher) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Quick Modules
            </h3>
            <span className="text-[10px] font-bold text-cyan-700">All shortcuts</span>
          </div>

          <div className="grid grid-cols-4 gap-y-3.5 gap-x-2">
            {/* 1. Queue */}
            <div
              onClick={() => navigate('/queue')}
              className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="relative w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200/80 flex items-center justify-center text-cyan-700 shadow-2xs">
                <Ticket className="w-5 h-5 text-cyan-700" />
                {waitingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                    {waitingCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center tracking-tight leading-tight">
                Queue
              </span>
            </div>

            {/* 2. Appointments */}
            <div
              onClick={() => navigate('/appointments')}
              className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="relative w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-700 shadow-2xs">
                <Calendar className="w-5 h-5 text-sky-700" />
                {dashboard.upcoming.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                    {dashboard.upcoming.length}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center tracking-tight leading-tight">
                Appts
              </span>
            </div>

            {/* 3. Patients */}
            <div
              onClick={() => navigate('/patients')}
              className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200/80 flex items-center justify-center text-cyan-700 shadow-2xs">
                <UsersRound className="w-5 h-5 text-cyan-700" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center tracking-tight leading-tight">
                Patients
              </span>
            </div>

            {/* 5. Invoices & Billing */}
            <div
              onClick={() => navigate('/billing')}
              className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs">
                <Receipt className="w-5 h-5 text-emerald-700" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center tracking-tight leading-tight">
                Billing
              </span>
            </div>

            {/* 6. Products & Supplies */}
            <div
              onClick={() => navigate('/lab-tracker')}
              className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shadow-2xs">
                <Truck className="w-5 h-5 text-teal-700" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center tracking-tight leading-tight">
                Lab Orders
              </span>
            </div>

            {/* 7. Quick Add Patient */}
            {roleConfig.canAddPatient && (
              <div
                onClick={() => {
                  if (setSelectedPatientData) setSelectedPatientData(null);
                  onAddPatient();
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-600 text-white flex items-center justify-center shadow-xs shadow-cyan-600/25">
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-cyan-800 text-center tracking-tight leading-tight">
                  + Patient
                </span>
              </div>
            )}

            {/* 8. Staff / Access (for Admin) OR Doctors */}
            {roleConfig.canAddDoctor ? (
              <div
                onClick={onAddDoctor}
                className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                  <Stethoscope className="w-5 h-5 text-slate-700" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center tracking-tight leading-tight">
                  + Doctor
                </span>
              </div>
            ) : (
              <div
                onClick={() => navigate('/doctors')}
                className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                  <Stethoscope className="w-5 h-5 text-slate-700" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center tracking-tight leading-tight">
                  Doctors
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile 2x2 Compact Metric Tiles */}
        <div className="grid grid-cols-2 gap-2.5">
          <div 
            onClick={() => navigate('/patients')}
            className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">{roleConfig.kpi1.title}</span>
              <div className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <UsersRound className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900 mt-1.5">
              {roleConfig.kpi1.value}
            </p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">{roleConfig.kpi1.subtext}</p>
          </div>

          <div 
            onClick={() => navigate('/appointments')}
            className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Upcoming</span>
              <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900 mt-1.5">
              {dashboard.upcoming.length}
            </p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">Scheduled visits</p>
          </div>

          <div 
            onClick={() => navigate('/queue')}
            className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">In Queue</span>
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Ticket className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <p className="text-xl font-black text-slate-900">{waitingCount}</p>
              {waitingCount > 0 && (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full">
                  Waiting
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">Live OPD tokens</p>
          </div>

          <div 
            className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Completed</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900 mt-1.5">
              {dashboard.completed.length}
            </p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">Completed visits</p>
          </div>
        </div>

        {/* Mobile Today's Schedule Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Today's Schedule
              </h3>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-0.5" role="tablist">
              <button
                type="button"
                onClick={() => setAppointmentTab('upcoming')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  appointmentTab === 'upcoming'
                    ? 'bg-white text-cyan-800 shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                Upcoming ({dashboard.upcoming.length})
              </button>
              <button
                type="button"
                onClick={() => setAppointmentTab('completed')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  appointmentTab === 'completed'
                    ? 'bg-white text-cyan-800 shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                Done ({dashboard.completed.length})
              </button>
            </div>
          </div>

          {/* Appointment Items */}
          <AppointmentRows
            appointments={appointmentTab === 'upcoming' ? dashboard.upcoming : dashboard.completed}
            patients={patients}
            doctors={doctors}
            resolveName={resolveName}
            emptyMessage={
              appointmentTab === 'upcoming'
                ? 'No appointments scheduled for today.'
                : 'No completed appointments yet.'
            }
            onSelect={handleAppointmentSelect}
          />

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => navigate('/appointments')}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
            >
              <span>Full calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Recent Patients Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UsersRound className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Recent Patients
              </h3>
            </div>
            {roleConfig.canAddPatient && (
              <button
                onClick={() => {
                  if (setSelectedPatientData) setSelectedPatientData(null);
                  onAddPatient();
                }}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Patient
              </button>
            )}
          </div>

          {dashboard.recentPatients.length ? (
            <div className="divide-y divide-slate-100">
              {dashboard.recentPatients.slice(0, 4).map((p, idx) => {
                const patInitials = (p.full_name || 'P')
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <div
                    key={p._id || p.id}
                    onClick={() => handlePatientSelect(p)}
                    className="py-2.5 flex items-center justify-between gap-3 active:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        idx % 2 === 0 ? 'bg-cyan-100 text-cyan-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {patInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{p.full_name || 'Unnamed'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{p.phone || p.email || 'No contact'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">No patients registered yet.</p>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => navigate('/patients')}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 w-full justify-center"
            >
              <span>View all patients</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💻 2. DESKTOP EXECUTIVE EXPERIENCE (For Tablet / Desktop: md+)            */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-5">
        {/* ── 1. Hero Greeting Banner ── */}
        <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-800">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-16 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-cyan-200 border border-white/15 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Clinic System Active
                </span>
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <GreetingIcon className="w-3.5 h-3.5 text-amber-300" />
                  {greeting.pill} &bull; {todayFormatted}
                </span>
              </div>

              <ScrollTriggerText
                as="h1"
                text={`${greeting.text}, ${currentUser?.name || (userRole === ROLES.ADMIN ? 'Administrator' : 'Doctor')}`}
                className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white"
                delay={0.05}
              />

              <ScrollReveal delay={0.18} y={18}>
                <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
                  {roleConfig.subtitle}
                </p>
              </ScrollReveal>
            </div>

            {/* Quick CTA Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {(!userRole || userRole === ROLES.ADMIN || userRole === ROLES.DOCTOR || (hasPermission && hasPermission('VIEW_QUEUE'))) && (
                <button
                  type="button"
                  onClick={() => navigate('/queue')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 backdrop-blur-xs active:scale-95"
                >
                  <Ticket className="w-4 h-4 text-cyan-300" />
                  <span>Live Queue</span>
                </button>
              )}

              {roleConfig.canAddDoctor && (
                <button
                  type="button"
                  onClick={onAddDoctor}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 backdrop-blur-xs active:scale-95"
                >
                  <Stethoscope className="w-4 h-4 text-teal-300" />
                  <span>Add Doctor</span>
                </button>
              )}

              {roleConfig.canAddPatient && (
                <button
                  type="button"
                  onClick={() => {
                    if (setSelectedPatientData) setSelectedPatientData(null);
                    onAddPatient();
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-cyan-500/25 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Patient</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── 2. Quick Operations Modules Strip ── */}
        {quickActions.length > 0 && (
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className={`group p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/70 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between ${action.color}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
                      <Icon className="w-4 h-4 text-cyan-700" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-black text-slate-900 group-hover:text-cyan-700 transition-colors leading-tight">
                      {action.label}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{action.desc}</p>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ── 3. High Impact KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            title={roleConfig.kpi1.title}
            value={roleConfig.kpi1.value}
            subtext={roleConfig.kpi1.subtext}
            icon={roleConfig.kpi1.icon}
            loading={dashboardLoading}
            iconBg={roleConfig.kpi1.iconBg}
            trendText={roleConfig.kpi1.trendText}
            trendUp={roleConfig.kpi1.trendUp}
            onClick={roleConfig.kpi1.onClick}
          />
          <KpiCard
            title={roleConfig.kpi2.title}
            value={roleConfig.kpi2.value}
            subtext={roleConfig.kpi2.subtext}
            icon={roleConfig.kpi2.icon}
            loading={dashboardLoading}
            iconBg={roleConfig.kpi2.iconBg}
            trendText={roleConfig.kpi2.trendText}
            trendUp={roleConfig.kpi2.trendUp}
            onClick={roleConfig.kpi2.onClick}
          />
          <KpiCard
            title={roleConfig.kpi3.title}
            value={roleConfig.kpi3.value}
            subtext={roleConfig.kpi3.subtext}
            icon={roleConfig.kpi3.icon}
            loading={dashboardLoading}
            iconBg={roleConfig.kpi3.iconBg}
            trendText={roleConfig.kpi3.trendText}
            trendUp={roleConfig.kpi3.trendUp}
            onClick={roleConfig.kpi3.onClick}
          />
          <KpiCard
            title={roleConfig.kpi4.title}
            value={roleConfig.kpi4.value}
            subtext={roleConfig.kpi4.subtext}
            icon={roleConfig.kpi4.icon}
            loading={dashboardLoading}
            iconBg={roleConfig.kpi4.iconBg}
            trendText={roleConfig.kpi4.trendText}
            trendUp={roleConfig.kpi4.trendUp}
            onClick={roleConfig.kpi4.onClick}
          />
        </div>

        {/* ── 4. Visual Analytics: Volume Trends & Status Breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Appointment Trends Chart */}
          <Panel
            title="Appointment Volume Trends"
            subtitle="6-month clinical booking trajectory"
            icon={TrendingUp}
            loading={dashboardLoading}
            action={
              <span className="text-[11px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200/80 px-2.5 py-1 rounded-full">
                {appointments.length} Total Visits
              </span>
            }
          >
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard.months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clinicActivityFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <Tooltip
                    cursor={{ stroke: '#0891b2', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs">
                            <p className="font-extrabold text-slate-900">{payload[0].payload.label}</p>
                            <p className="font-bold text-cyan-700 mt-0.5">
                              {payload[0].value} appointments
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0891b2"
                    strokeWidth={3}
                    fill="url(#clinicActivityFill)"
                    activeDot={{ r: 5, fill: '#0891b2', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Appointment Status Distribution */}
          <Panel
            title="Schedule Distribution"
            subtitle="Breakdown of bookings by state"
            icon={Activity}
            loading={dashboardLoading}
          >
            {Object.keys(dashboard.statuses).length ? (
              <div className="space-y-4 pt-1">
                {Object.entries(dashboard.statuses).map(([status, count]) => {
                  const pct = Math.round((count / totalStatus) * 100);
                  const s = status.toLowerCase();
                  let barColor = 'bg-cyan-600';
                  let tagCls = 'bg-cyan-50 text-cyan-800 border-cyan-200';
                  if (s === 'completed') {
                    barColor = 'bg-emerald-500';
                    tagCls = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  } else if (s === 'cancelled') {
                    barColor = 'bg-rose-500';
                    tagCls = 'bg-rose-50 text-rose-800 border-rose-200';
                  } else if (s === 'pending' || s === 'in-progress') {
                    barColor = 'bg-amber-500';
                    tagCls = 'bg-amber-50 text-amber-800 border-amber-200';
                  }

                  return (
                    <div key={status} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${tagCls}`}>
                            {status}
                          </span>
                          <span className="text-slate-500 font-semibold">{count} visits</span>
                        </div>
                        <span className="font-extrabold text-slate-800">{pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                No appointments scheduled yet.
              </div>
            )}
          </Panel>
        </div>

        {/* ── 5. Operational Agenda: Appointments List & Recent Patients ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Appointments Feed with Tabs */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-xs ring-1 ring-slate-100/60">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Appointments</h2>
              </div>

              {/* Upcoming / Completed Tabs */}
              <div className="flex rounded-xl bg-slate-100/90 p-1" role="tablist" aria-label="Appointments">
                <button
                  type="button"
                  role="tab"
                  aria-selected={appointmentTab === 'upcoming'}
                  onClick={() => setAppointmentTab('upcoming')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    appointmentTab === 'upcoming'
                      ? 'bg-white text-cyan-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upcoming ({dashboard.upcoming.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={appointmentTab === 'completed'}
                  onClick={() => setAppointmentTab('completed')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    appointmentTab === 'completed'
                      ? 'bg-white text-cyan-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Completed ({dashboard.completed.length})
                </button>
              </div>
            </div>

            {dashboardLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <AppointmentRows
                appointments={appointmentTab === 'upcoming' ? dashboard.upcoming : dashboard.completed}
                patients={patients}
                doctors={doctors}
                resolveName={resolveName}
                emptyMessage={
                  appointmentTab === 'upcoming'
                    ? 'No upcoming appointments scheduled.'
                    : 'No completed appointments recorded.'
                }
                onSelect={handleAppointmentSelect}
              />
            )}

            <div className="mt-3.5 pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>View full appointment calendar</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </section>

          {/* Recent Patients Roster */}
          <Panel
            title="Recent Patients"
            subtitle="Latest patient registrations"
            icon={UsersRound}
            loading={dashboardLoading}
            action={
              roleConfig.canAddPatient && (
                <button
                  type="button"
                  onClick={() => {
                    if (setSelectedPatientData) setSelectedPatientData(null);
                    onAddPatient();
                  }}
                  className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200/80 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
              )
            }
          >
            {dashboard.recentPatients.length ? (
              <div className="space-y-2.5">
                {dashboard.recentPatients.map((patient, index) => {
                  const patInitials = (patient.full_name || 'P')
                    .split(' ')
                    .filter(Boolean)
                    .map((name) => name[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={patient._id || patient.id}
                      onClick={() => handlePatientSelect(patient)}
                      className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-cyan-200 p-3 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                    >
                      <div
                        className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-xs font-black ring-2 ring-white shadow-xs group-hover:scale-105 transition-transform ${
                          index % 2 === 0
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {patInitials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold text-slate-900 truncate group-hover:text-cyan-600 transition-colors">
                            {patient.full_name || 'Unnamed Patient'}
                          </p>
                          {patient.gender && (
                            <span className="text-[10px] font-bold text-slate-400 capitalize">
                              &bull; {patient.gender}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs font-medium text-slate-500 truncate">
                          {patient.phone ? `📞 ${patient.phone}` : patient.email || 'No contact provided'}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          {formatDate(patient.createdAt)}
                        </span>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                No patients registered yet.
              </div>
            )}

            <div className="mt-3.5 pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => navigate('/patients')}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>View all registered patients</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
