import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Search, RefreshCw, Plus, Phone, Mail, Calendar, Clock,
  User, Stethoscope, AlertCircle, CheckCircle2, Trash2, Edit3,
  Eye, UserCheck, X, ChevronDown, MessageSquare, Sparkles,
  ExternalLink, Filter, HelpCircle, ArrowRightCircle
} from 'lucide-react';
import { ContextProvider } from '../../context/store';
import {
  getEnquiries,
  createEnquiry,
  updateEnquiry,
  updateEnquiryStatus,
  convertEnquiry,
  deleteEnquiry
} from '../../services/enquiries';
import { DataPageSkeleton } from '../DataPageSkeleton';
import { useLocation } from 'react-router-dom';

// Normalize API responses (handles array, { data: [...] }, { data: { enquiries: [...] } }, { enquiries: [...] })
const normalizeEnquiries = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.enquiries)) return res.data.enquiries;
  if (Array.isArray(res?.enquiries)) return res.enquiries;
  return [];
};

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDoctorDisplay = (name) => {
  if (!name) return '';
  const trimmed = name.trim();
  return /^dr\.?\s+/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
};

const STATUS_CONFIG = {
  'New': { label: 'New', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Contacted': { label: 'Contacted', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Follow-up Needed': { label: 'Follow-up Needed', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Converted': { label: 'Converted', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Lost': { label: 'Lost', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Closed': { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

const PRIORITY_CONFIG = {
  'Urgent': { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-600' },
  'High': { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  'Medium': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  'Low': { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const SOURCES = ['Website', 'Phone Call', 'Walk-in', 'Social Media', 'Google Ad', 'Referral', 'Other'];
const STATUSES = ['New', 'Contacted', 'Follow-up Needed', 'Converted', 'Lost', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const COMMON_SERVICES = [
  'Skin consultation',
  'Acne care',
  'Chemical peel',
  'Laser skin treatment',
  'Hydration & barrier repair',
  'Pigmentation care',
  'Scar revision',
  'Sensitive skin consultation',
  'Fine-line treatment',
  'Post-treatment follow-up'
];

export const Enquiries = () => {
  const { token, Doctors, getAllPatience, hasPermission } = useContext(ContextProvider);

  const location = useLocation()
  const canManage = hasPermission ? Boolean(hasPermission('MANAGE_ENQUIRY')) : false;
  const canEdit = hasPermission ? Boolean(hasPermission('EDIT_ENQUIRY')) : false;
  const canDelete = hasPermission ? Boolean(hasPermission('DELETE_ENQUIRY')) : false;

  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals state
  const [viewingEnquiry, setViewingEnquiry] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Status Change Prompt Modal
  const [statusChangeTarget, setStatusChangeTarget] = useState(null);
  const [statusReason, setStatusReason] = useState('');

  // Form state
  const initialForm = {
    name: '',
    phone: '',
    email: '',
    serviceRequested: '',
    preferredDoctorId: '',
    preferredDoctorName: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
    source: 'Website',
    priority: 'Medium'
  };
  const [formData, setFormData] = useState(initialForm);

  const doctorsList = useMemo(() => {
    return Array.isArray(Doctors?.data) ? Doctors.data : Array.isArray(Doctors) ? Doctors : [];
  }, [Doctors]);
  function getFilteredData(res) {
    // Safely extract the array
    const list = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
        ? res
        : [];

    const isFollowUpPage = location.pathname === "/enquiry-follow-up";

    if (isFollowUpPage) {
      return list.filter(
        (d) => (d.status || '').toLowerCase().trim() === "follow-up needed"
      );
    }

    return list.filter(
      (d) => (d.status || '').toLowerCase().trim() !== "follow-up needed"
    );
  }

  const fetchEnquiriesList = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getEnquiries(token);
      const data = getFilteredData(res)
      setEnquiries(normalizeEnquiries(data));
    } catch (err) {
      console.error('Failed to load enquiries:', err);
      setError(err?.response?.data?.message || 'Failed to fetch enquiries');
      setEnquiries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiriesList();
  }, [token,location.pathname]);

  // Toast feedback auto-dismiss
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Filtered List
  const filteredEnquiries = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enquiries.filter((item) => {
      const name = (item.name || item.full_name || '').toLowerCase();
      const phone = String(item.phone || item.mobile || '').toLowerCase();
      const email = String(item.email || '').toLowerCase();
      const service = String(item.serviceRequested || item.service || '').toLowerCase();
      const message = String(item.message || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || phone.includes(q) || email.includes(q) || service.includes(q) || message.includes(q);
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesSource = sourceFilter === 'ALL' || item.source === sourceFilter;
      const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesSource && matchesPriority;
    });
  }, [enquiries, search, statusFilter, sourceFilter, priorityFilter]);

  // KPI Calculations
  const totalCount = enquiries.length;
  const newCount = enquiries.filter((e) => (e.status || 'New') === 'New').length;
  const followUpCount = enquiries.filter((e) => ['Contacted', 'Follow-up Needed'].includes(e.status)).length;
  const convertedCount = enquiries.filter((e) => e.status === 'Converted').length;

  // Open Form modal in Add or Edit mode
  const handleOpenAdd = () => {
    if (!canManage) {
      alert('Permission denied: You do not have privilege to add new enquiries.');
      return;
    }
    setEditingEnquiry(null);
    setFormData(initialForm);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (enquiry) => {
    if (!canEdit) {
      alert('Permission denied: You do not have privilege to edit enquiries.');
      return;
    }
    setEditingEnquiry(enquiry);
    setFormData({
      name: enquiry.name || enquiry.full_name || '',
      phone: enquiry.phone || enquiry.mobile || '',
      email: enquiry.email || '',
      serviceRequested: enquiry.serviceRequested || enquiry.service || '',
      preferredDoctorId: enquiry.preferredDoctorId || '',
      preferredDoctorName: enquiry.preferredDoctorName || '',
      preferredDate: enquiry.preferredDate ? enquiry.preferredDate.split('T')[0] : '',
      preferredTime: enquiry.preferredTime || '',
      message: enquiry.message || '',
      source: enquiry.source || 'Website',
      priority: enquiry.priority || 'Medium'
    });
    setIsFormModalOpen(true);
  };

  // Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Please provide both Patient/Enquirer Name and Phone number.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingEnquiry) {
        if (!canEdit) {
          alert('Permission denied: You do not have privilege to edit enquiries.');
          return;
        }
        await updateEnquiry(token, editingEnquiry._id || editingEnquiry.id, formData);
        setActionSuccess('Enquiry updated successfully!');
      } else {
        if (!canManage) {
          alert('Permission denied: You do not have privilege to create enquiries.');
          return;
        }
        await createEnquiry(token, formData);
        setActionSuccess('New enquiry created successfully!');
      }
      setIsFormModalOpen(false);
      await fetchEnquiriesList();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to save enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Update
  const handleQuickStatusChange = async (enquiry, newStatus) => {
    if (!canEdit && !canManage) {
      alert('Permission denied: You do not have privilege to change enquiry status.');
      return;
    }

    if (['Lost', 'Closed'].includes(newStatus)) {
      setStatusChangeTarget({ enquiry, newStatus });
      setStatusReason('');
      return;
    }

    try {
      await updateEnquiryStatus(token, enquiry._id || enquiry.id, { status: newStatus });
      setActionSuccess(`Status updated to "${newStatus}"!`);
      // Update local state directly for snappy UI
      setEnquiries((prev) =>
        prev.map((item) => (item._id === enquiry._id ? { ...item, status: newStatus } : item))
      );
      if (viewingEnquiry?._id === enquiry._id) {
        setViewingEnquiry((prev) => ({ ...prev, status: newStatus }));
      }
      fetchEnquiriesList()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleConfirmReasonStatusChange = async () => {
    if (!statusChangeTarget) return;
    if (!canEdit && !canManage) {
      alert('Permission denied: You do not have privilege to change enquiry status.');
      return;
    }
    const { enquiry, newStatus } = statusChangeTarget;
    try {
      await updateEnquiryStatus(token, enquiry._id || enquiry.id, {
        status: newStatus,
        cancellationReason: statusReason
      });
      setActionSuccess(`Status updated to "${newStatus}"!`);
      setEnquiries((prev) =>
        prev.map((item) =>
          item._id === enquiry._id ? { ...item, status: newStatus, cancellationReason: statusReason } : item
        )
      );
      if (viewingEnquiry?._id === enquiry._id) {
        setViewingEnquiry((prev) => ({ ...prev, status: newStatus, cancellationReason: statusReason }));
      }
      setStatusChangeTarget(null);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status.');
    }
  };

  // Convert Enquiry
  const handleConvert = async (enquiry) => {
    if (!canManage) {
      alert('Permission denied: You do not have privilege to convert enquiries to patients.');
      return;
    }
    const confirmConvert = window.confirm(
      `Convert enquiry for "${enquiry.name || 'this patient'}" to an active registered Patient?`
    );
    if (!confirmConvert) return;

    try {
      await convertEnquiry(token, enquiry._id || enquiry.id, { createPatient: true });
      setActionSuccess(`Enquiry successfully converted to patient!`);
      if (getAllPatience) {
        getAllPatience().catch(() => { });
      }
      await fetchEnquiriesList();
      if (viewingEnquiry?._id === enquiry._id) {
        setViewingEnquiry((prev) => ({ ...prev, status: 'Converted' }));
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to convert enquiry.');
    }
  };

  // Delete Enquiry
  const handleDelete = async (enquiry) => {
    if (!canDelete) {
      alert('Permission denied: Your account does not have DELETE_ENQUIRY privilege.');
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the enquiry from "${enquiry.name || 'this lead'}"?`
    );
    if (!confirmDelete) return;

    try {
      await deleteEnquiry(token, enquiry._id || enquiry.id);
      setActionSuccess('Enquiry deleted successfully.');
      setEnquiries((prev) => prev.filter((item) => item._id !== enquiry._id));
      if (viewingEnquiry?._id === enquiry._id) {
        setViewingEnquiry(null);
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete enquiry.');
    }
  };

  if (isLoading && enquiries.length === 0) {
    return <DataPageSkeleton kpis={4} rows={6} />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto space-y-4 pb-28 sm:pb-32 md:pb-6">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-[slideInDown_0.2s_ease-out]">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-gradient-to-b before:from-cyan-500 before:to-teal-600">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Patient Enquiries
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Capture skin-care enquiries, track follow-ups, and convert them to clinic appointments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchEnquiriesList}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs shadow-cyan-600/20 uppercase tracking-wider cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Enquiry</span>
            </button>
          )}
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Enquiries"
          value={totalCount}
          caption="All recorded leads"
          icon={MessageSquare}
          color="text-cyan-600"
          borderAccent="border-cyan-100"
        />
        <MetricCard
          title="New Leads"
          value={newCount}
          caption="Pending first contact"
          icon={Sparkles}
          color="text-amber-500"
          borderAccent="border-amber-100"
        />
        <MetricCard
          title="In Follow-Up"
          value={followUpCount}
          caption="Contacted / Follow-up"
          icon={Phone}
          color="text-purple-600"
          borderAccent="border-purple-100"
        />
        <MetricCard
          title="Converted"
          value={convertedCount}
          caption="Turned into patients"
          icon={CheckCircle2}
          color="text-emerald-600"
          borderAccent="border-emerald-100"
        />
      </div>

      {/* Main Table Card & Toolbar */}
      <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs ring-1 ring-slate-100/70">
        {/* Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-200/80 bg-slate-50/80 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email, service..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs sm:text-sm font-medium text-slate-700 outline-none shadow-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none shadow-xs cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Statuses ({totalCount})</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none shadow-xs cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Sources</option>
              {SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none shadow-xs cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Priorities</option>
              {PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr}
                </option>
              ))}
            </select>

            {(search || statusFilter !== 'ALL' || sourceFilter !== 'ALL' || priorityFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setSourceFilter('ALL');
                  setPriorityFilter('ALL');
                }}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-6 m-4 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-rose-900">Failed to load enquiries</h3>
            <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchEnquiriesList}
              className="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Mobile Cards View (< 768px) */}
        <div className="md:hidden divide-y divide-slate-100 bg-slate-50/40 p-2.5 sm:p-3 space-y-2.5">
          {filteredEnquiries.length > 0 ? (
            filteredEnquiries.map((enquiry) => {
              const name = enquiry.name || enquiry.full_name || 'Unnamed enquiry';
              const statusCfg = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG['New'];
              const priorityCfg = PRIORITY_CONFIG[enquiry.priority] || PRIORITY_CONFIG['Medium'];
              const phone = enquiry.phone || '';

              return (
                <div key={enquiry._id || enquiry.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs shadow-cyan-600/20">
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{name}</h4>
                        <p className="text-xs text-slate-500 font-medium truncate">{phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {enquiry.status || 'New'}
                      </span>
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${priorityCfg.bg} ${priorityCfg.text}`}>
                        {enquiry.priority || 'Medium'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Service</span>
                      <span className="font-semibold text-cyan-700 truncate block">
                        {enquiry.serviceRequested || enquiry.service || 'General Consultation'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Doctor</span>
                      <span className="font-semibold text-slate-700 truncate block">
                        {formatDoctorDisplay(enquiry.preferredDoctorName) || 'Not Assigned'}
                      </span>
                    </div>
                  </div>

                  {enquiry.message && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl italic line-clamp-2">
                      "{enquiry.message}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDate(enquiry.createdAt || enquiry.created_at)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Call</span>
                        </a>
                      )}
                      <button
                        onClick={() => setViewingEnquiry(enquiry)}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(enquiry)}
                          className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canManage && enquiry.status !== 'Converted' && (
                        <button
                          onClick={() => handleConvert(enquiry)}
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer"
                          title="Convert to patient"
                        >
                          Convert
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(enquiry)}
                          className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState onAdd={handleOpenAdd} />
          )}
        </div>

        {/* 2. Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
          <table className="w-full text-left border-collapse min-w-[1240px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5 min-w-[210px]">Enquirer / Lead</th>
                <th className="py-3.5 px-4 min-w-[150px]">Contact</th>
                <th className="py-3.5 px-4 min-w-[210px]">Requested Service</th>
                <th className="py-3.5 px-4 min-w-[150px]">Preferred Slot</th>
                <th className="py-3.5 px-4 min-w-[140px]">Priority & Source</th>
                <th className="py-3.5 px-4 min-w-[160px]">Status</th>
                <th className="py-3.5 px-4 min-w-[120px]">Received</th>
                <th className="py-3.5 px-5 text-right min-w-[170px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredEnquiries.length > 0 ? (
                filteredEnquiries.map((enquiry) => {
                  const name = enquiry.name || enquiry.full_name || 'Unnamed enquiry';
                  const statusCfg = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG['New'];
                  const priorityCfg = PRIORITY_CONFIG[enquiry.priority] || PRIORITY_CONFIG['Medium'];

                  return (
                    <tr key={enquiry._id || enquiry.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 leading-snug whitespace-nowrap">{name}</p>
                            {enquiry.message && (
                              <p className="text-xs text-slate-500 truncate max-w-[210px]" title={enquiry.message}>
                                {enquiry.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <a
                            href={`tel:${enquiry.phone}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{enquiry.phone || '—'}</span>
                          </a>
                          {enquiry.email && (
                            <a
                              href={`mailto:${enquiry.email}`}
                              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors truncate max-w-[160px]"
                              title={enquiry.email}
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{enquiry.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Service & Preferred Doctor */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap shadow-2xs">
                            {enquiry.serviceRequested || enquiry.service || 'General Consultation'}
                          </span>
                          {enquiry.preferredDoctorName && (
                            <div 
                              className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap"
                              title={formatDoctorDisplay(enquiry.preferredDoctorName)}
                            >
                              <Stethoscope className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate max-w-[200px]">{formatDoctorDisplay(enquiry.preferredDoctorName)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Preferred Date & Time */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDate(enquiry.preferredDate)}</span>
                          </div>
                          {enquiry.preferredTime && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{enquiry.preferredTime}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Priority & Source */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${priorityCfg.bg} ${priorityCfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                            {enquiry.priority || 'Medium'}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                            {enquiry.source || 'Website'}
                          </span>
                        </div>
                      </td>

                      {/* Status with Quick Select */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {(canEdit || canManage) ? (
                          <div className="relative inline-block">
                            <select
                              value={enquiry.status || 'New'}
                              onChange={(e) => handleQuickStatusChange(enquiry, e.target.value)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer outline-none transition-all ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border} focus:ring-2 focus:ring-indigo-500/20 shadow-2xs whitespace-nowrap`}
                            >
                              {STATUSES.map((st) => (
                                <option key={st} value={st} className="bg-white text-slate-800">
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                            {enquiry.status || 'New'}
                          </span>
                        )}
                      </td>

                      {/* Received Date */}
                      <td className="py-4 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                        {formatDate(enquiry.createdAt || enquiry.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setViewingEnquiry(enquiry)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer shadow-2xs"
                            title="View full enquiry details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(enquiry)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer shadow-2xs"
                              title="Edit enquiry"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {canManage && (
                            enquiry.status !== 'Converted' ? (
                              <button
                                onClick={() => handleConvert(enquiry)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Convert to active patient"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Convert</span>
                              </button>
                            ) : (
                              <span className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-200">
                                Converted ✓
                              </span>
                            )
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(enquiry)}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
                              title="Delete enquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8">
                    <EmptyState onAdd={handleOpenAdd} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. MODALS */}
      {/* ==================================================================== */}

      {/* VIEW DETAILS MODAL */}
      {viewingEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                  {(viewingEnquiry.name || 'E').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{viewingEnquiry.name || 'Enquiry Details'}</h3>
                  <p className="text-xs text-slate-500">
                    Received on {formatDate(viewingEnquiry.createdAt || viewingEnquiry.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingEnquiry(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Quick Status Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-600">Current Status:</span>
                {(canEdit || canManage) ? (
                  <select
                    value={viewingEnquiry.status || 'New'}
                    onChange={(e) => handleQuickStatusChange(viewingEnquiry, e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-xs outline-none cursor-pointer"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-xs">
                    {viewingEnquiry.status || 'New'}
                  </span>
                )}
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={`tel:${viewingEnquiry.phone}`}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</p>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                          {viewingEnquiry.phone || '—'}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                  </a>

                  <a
                    href={`mailto:${viewingEnquiry.email}`}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                          {viewingEnquiry.email || '—'}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                  </a>
                </div>
              </div>

              {/* Consultation Preferences */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Requested Skin Care
                </h4>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Service Requested:</span>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                      {viewingEnquiry.serviceRequested || viewingEnquiry.service || 'General Consultation'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Preferred Doctor:</span>
                    <span className="text-xs font-bold text-slate-800">
                      {viewingEnquiry.preferredDoctorName ? formatDoctorDisplay(viewingEnquiry.preferredDoctorName) : 'Any Available Doctor'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Preferred Date & Time:</span>
                    <span className="text-xs font-bold text-slate-800">
                      {formatDate(viewingEnquiry.preferredDate)} {viewingEnquiry.preferredTime ? `at ${viewingEnquiry.preferredTime}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Priority:</span>
                    <span className="text-xs font-bold text-slate-800">{viewingEnquiry.priority || 'Medium'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Lead Source:</span>
                    <span className="text-xs font-bold text-slate-800">{viewingEnquiry.source || 'Website'}</span>
                  </div>
                </div>
              </div>

              {/* Message from Patient */}
              {viewingEnquiry.message && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Patient Note / Message
                  </h4>
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 leading-relaxed">
                    {viewingEnquiry.message}
                  </div>
                </div>
              )}

              {/* Cancellation Reason if any */}
              {viewingEnquiry.cancellationReason && (
                <div>
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                    Cancellation / Lost Reason
                  </h4>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                    {viewingEnquiry.cancellationReason}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
              <div>
                {canDelete && (
                  <button
                    onClick={() => {
                      const toDelete = viewingEnquiry;
                      handleDelete(toDelete);
                    }}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => {
                      const toEdit = viewingEnquiry;
                      setViewingEnquiry(null);
                      handleOpenEdit(toEdit);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                )}

                {canManage && viewingEnquiry.status !== 'Converted' && (
                  <button
                    onClick={() => handleConvert(viewingEnquiry)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Convert to Patient</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ENQUIRY MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <h3 className="text-lg font-black text-slate-900">
                {editingEnquiry ? 'Edit Enquiry' : 'Add New Patient Enquiry'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enquirer / Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. patient@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service Requested
                  </label>
                  <input
                    type="text"
                    list="services-list"
                    placeholder="e.g. Acne care, chemical peel"
                    value={formData.serviceRequested}
                    onChange={(e) => setFormData({ ...formData, serviceRequested: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <datalist id="services-list">
                    {COMMON_SERVICES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Doctor
                  </label>
                  <select
                    value={formData.preferredDoctorName}
                    onChange={(e) => {
                      const selectedDoc = doctorsList.find((d) => (d.full_name || d.name) === e.target.value);
                      setFormData({
                        ...formData,
                        preferredDoctorName: e.target.value,
                        preferredDoctorId: selectedDoc ? (selectedDoc._id || selectedDoc.id) : ''
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Any Available Doctor</option>
                    {doctorsList.map((doc) => {
                      const dName = doc.full_name || doc.name;
                      return (
                        <option key={doc._id || doc.id} value={dName}>
                          {formatDoctorDisplay(dName)} {doc.specialization ? `(${doc.specialization})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:30 AM"
                      value={formData.preferredTime}
                      onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                      className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enquiry Message / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Details about patient issue, inquiry background, or questions..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white uppercase tracking-wider transition-colors shadow-xs shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingEnquiry ? 'Update Enquiry' : 'Create Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCELLATION / LOST REASON MODAL */}
      {statusChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Mark Enquiry as "{statusChangeTarget.newStatus}"
            </h3>
            <p className="text-xs text-slate-500">
              Optionally provide a reason or note for updating this lead to {statusChangeTarget.newStatus}.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Patient found another provider, fee was too high, not responsive..."
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusChangeTarget(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReasonStatusChange}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                Confirm Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      {canManage && (
        <button
          type="button"
          onClick={handleOpenAdd}
          className="md:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-3.5 rounded-full shadow-lg shadow-cyan-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Add Enquiry"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};

// Subcomponent: Metric Card
const MetricCard = ({ title, value, caption, icon: Icon, color, borderAccent }) => (
  <section className={`bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden`}>
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{title}</p>
      <div className={`p-2 rounded-xl bg-slate-50 border ${borderAccent}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
    </div>
    <p className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    <p className="mt-0.5 text-xs font-medium text-slate-500">{caption}</p>
  </section>
);

// Subcomponent: Empty State
const EmptyState = ({ onAdd }) => (
  <div className="py-16 text-center p-6">
    <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-cyan-600 border border-cyan-100">
      <MessageSquare className="w-7 h-7" />
    </div>
    <h3 className="text-base font-bold text-slate-900 mb-1">No enquiries found</h3>
    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
      No leads match your current search and filters. Add a new enquiry or reset the filters.
    </p>
    <button
      onClick={onAdd}
      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-95"
    >
      Add First Enquiry
    </button>
  </div>
);
