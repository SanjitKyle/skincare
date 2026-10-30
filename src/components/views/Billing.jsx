import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ContextProvider, useAuth } from '../../context/store';
import { invoiceService } from '../../services/invoiceService';
import {
  Receipt, Plus, Search, FileText, Download, Eye,
  CheckCircle2, Clock, AlertCircle, DollarSign,
  Calendar, User, ArrowUpRight, Banknote, X,
  Trash2, Phone, Mail, CreditCard, Tag, Percent, Save,
  Printer, RefreshCw, ChevronLeft, ChevronRight, Check,
  Stethoscope, Building2, ShieldAlert, Sparkles, Filter,
  MoreVertical, AlertOctagon, HelpCircle
} from 'lucide-react';

/* ─────────────── Constants & Enums ─────────────── */
const STATUS_CONFIG = {
  Paid:      { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  Pending:   { dot: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-800 border-amber-200',     icon: Clock },
  Overdue:   { dot: 'bg-red-500',     badge: 'bg-red-100 text-red-800 border-red-200',         icon: AlertCircle },
  Cancelled: { dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-700 border-slate-200',     icon: AlertOctagon },
};

const COMMON_SKIN_SERVICES = [
  'Skin consultation & assessment',
  'Acne care plan',
  'Chemical peel session',
  'Laser skin treatment',
  'Hydration & barrier repair',
  'Pigmentation treatment',
  'Scar revision session',
  'Skin-care product kit',
  'Post-treatment follow-up',
  'Sensitive skin consultation',
  'Fine-line treatment',
  'LED light therapy',
  'Skin analysis',
  'Aftercare consultation',
  'Custom skin treatment / Other'
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Insurance'];

const RUPEE = '\u20B9';
const fmt = (v) => `${RUPEE}${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const emptyItem = () => ({
  description: '',
  qty: 1,
  rate: '',
  discount: 0
});

/* ─────────────── Sub-Components ─────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      <Icon className="w-3 h-3 shrink-0" />
      {status}
    </span>
  );
}

function KpiCard({ title, value, sub, icon: Icon, colorClass, bgClass, trend }) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${bgClass} shrink-0 shadow-2xs`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
            <ArrowUpRight className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        <p className="text-xs font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{title}</p>
        {sub && <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

/* ─────────────── Safe Data String Sanitizers ─────────────── */
const safeString = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (typeof val.full_name === 'string' && val.full_name.trim()) return val.full_name.trim();
    if (typeof val.name === 'string' && val.name.trim()) return val.name.trim();
    if (typeof val.patient_name === 'string' && val.patient_name.trim()) return val.patient_name.trim();
    if (typeof val.number === 'string' || typeof val.number === 'number') return String(val.number);
    if (typeof val.phone === 'string' || typeof val.phone === 'number') return String(val.phone);
    if (val.first) return [val.first, val.middle, val.last].filter(Boolean).join(' ');
    return fallback;
  }
  return fallback;
};

const getPatientName = (p) => {
  if (!p) return 'Unnamed Patient';
  return (
    safeString(p.full_name) ||
    safeString(p.name) ||
    safeString(p.patient_name) ||
    'Unnamed Patient'
  );
};

const getPatientPhone = (p) => {
  if (!p) return 'No phone';
  const phone = safeString(p.phone) || safeString(p.mobile) || safeString(p.contact) || safeString(p.emergencty_contact_phone);
  return phone || 'No phone';
};

const getPatientGender = (p) => {
  if (!p) return 'Patient';
  return safeString(p.gender) || 'Patient';
};

const getPatientAge = (p) => {
  if (!p) return '';
  if (p.age !== undefined && p.age !== null && typeof p.age !== 'object') {
    return `${p.age}`;
  }
  if (p.date_of_birth && typeof p.date_of_birth === 'string') {
    const birthYear = new Date(p.date_of_birth).getFullYear();
    if (!isNaN(birthYear)) {
      const calculated = new Date().getFullYear() - birthYear;
      if (calculated > 0 && calculated < 130) return `${calculated}`;
    }
  }
  return '';
};

/* ─────────────── Error Boundary for Invoice Modal ─────────────── */
class InvoiceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("InvoiceModal Error Boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl mx-auto">
              ⚠️
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Patient Selection Notice</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {this.state.error?.message || 'An unexpected error occurred while rendering the invoice form.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onClose) this.props.onClose();
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close &amp; Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─────────────── Invoice Creation Modal ─────────────── */
function InvoiceFormModal({ isOpen, onClose, onSuccess }) {
  const { Patients, Doctors } = useContext(ContextProvider);

  // Safe patient & doctor lists from context
  const safePatients = useMemo(() => {
    let list = [];
    if (Array.isArray(Patients)) list = Patients;
    else if (Array.isArray(Patients?.data)) list = Patients.data;
    else if (Array.isArray(Patients?.patients)) list = Patients.patients;
    else if (Array.isArray(Patients?.data?.data)) list = Patients.data.data;
    return list;
  }, [Patients]);

  const safeDoctors = useMemo(() => {
    let list = [];
    if (Array.isArray(Doctors)) list = Doctors;
    else if (Array.isArray(Doctors?.data)) list = Doctors.data;
    else if (Array.isArray(Doctors?.doctors)) list = Doctors.doctors;
    else if (Array.isArray(Doctors?.data?.data)) list = Doctors.data.data;
    return list;
  }, [Doctors]);

  const todayStr = new Date().toISOString().split('T')[0];

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [status, setStatus] = useState('Paid');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [dueDate, setDueDate] = useState('');
  const [taxPercent, setTaxPercent] = useState(18);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { description: 'Skin consultation & assessment', qty: 1, rate: 500, discount: 0 }
  ]);
  const [customDescriptions, setCustomDescriptions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto-select first doctor if available
  useEffect(() => {
    if (safeDoctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(safeDoctors[0]._id || safeDoctors[0].id || '');
    }
  }, [safeDoctors, selectedDoctorId]);

  // Filtered patients for dropdown/search - safely sanitizing name & phone strings
  const filteredPatients = useMemo(() => {
    if (!Array.isArray(safePatients)) return [];
    const query = String(patientSearch || '').trim().toLowerCase();
    if (!query) return safePatients.slice(0, 10);
    return safePatients.filter((p) => {
      if (!p) return false;
      const name = getPatientName(p).toLowerCase();
      const phone = getPatientPhone(p).toLowerCase();
      return name.includes(query) || phone.includes(query);
    }).slice(0, 10);
  }, [safePatients, patientSearch]);

  const handleSelectPatient = (p, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!p) return;
    const pId = String(p._id || p.id || '');
    setSelectedPatient(p);
    setSelectedPatientId(pId);
    setPatientSearch('');
    setErrors((prev) => ({ ...prev, patientId: null }));
  };

  const handleClearPatient = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedPatient(null);
    setSelectedPatientId('');
    setPatientSearch('');
  };

  /* Line-item helpers */
  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, [field]: value } : it))
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, idx) => idx !== index));

  /* Live Client-Side Calculations for Real-Time UI Preview */
  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const line = Number(it.qty || 0) * Number(it.rate || 0);
      const disc = line * (Number(it.discount || 0) / 100);
      return sum + Math.max(0, line - disc);
    }, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return subtotal * (Number(taxPercent || 0) / 100);
  }, [subtotal, taxPercent]);

  const totalAmount = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  /* Form Validation */
  const validate = () => {
    const errs = {};
    const patientId = selectedPatientId || selectedPatient?._id || selectedPatient?.id;
    if (!patientId) errs.patientId = 'Please select a patient';
    if (!selectedDoctorId) errs.doctorId = 'Please select a treating doctor';
    if (!items || items.length === 0) {
      errs.items = 'Please add at least one line item';
    } else {
      const hasEmptyItem = items.some((it, idx) => {
        const desc = it.description === 'Custom Treatment / Other'
          ? (customDescriptions[idx] || '').trim()
          : (it.description || '').trim();
        return !desc || Number(it.qty) <= 0 || Number(it.rate) <= 0;
      });
      if (hasEmptyItem) {
        errs.items = 'All line items must have a valid description, quantity > 0, and rate > 0';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* Form Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Prepare line items formatting (handling custom service text)
      const payloadItems = items.map((it, idx) => ({
        description: it.description === 'Custom Treatment / Other'
          ? (customDescriptions[idx] || 'Custom Treatment')
          : it.description,
        qty: Number(it.qty) || 1,
        rate: Number(it.rate) || 0,
        discount: Number(it.discount) || 0
      }));

      const finalPatientId = selectedPatientId || selectedPatient?._id || selectedPatient?.id;
      const payload = {
        patientId: finalPatientId,
        doctorId: selectedDoctorId,
        items: payloadItems,
        taxPercent: Number(taxPercent) || 0,
        paymentMethod: paymentMethod,
        status: status,
        dueDate: dueDate || undefined,
        notes: notes.trim()
      };

      const result = await invoiceService.createInvoice(payload);
      toast.success(result.message || 'Invoice created successfully!');
      if (onSuccess) onSuccess(result.data);
      onClose();
    } catch (err) {
      console.error('Invoice creation failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to create invoice';
      toast.error(msg);
      setErrors((prev) => ({ ...prev, api: msg }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-xl shadow-xs ring-1 ring-white/20">
              🧾
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Generate Patient Bill &amp; Invoice</h2>
              <p className="text-xs text-indigo-100 font-semibold mt-0.5">
                Skin care clinic billing with invoice tracking and treatment services
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {errors.api && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              {errors.api}
            </div>
          )}

          {/* Section 1: Patient Selection */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Select Patient <span className="text-red-500">*</span>
              </label>
              {selectedPatient && (
                <button
                  type="button"
                  onClick={handleClearPatient}
                  className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Change Patient
                </button>
              )}
            </div>

            {!selectedPatient ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by patient name or phone number..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-xs">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((p, pIdx) => {
                      const pId = String(p._id || p.id || `pat-${pIdx}`);
                      const pName = getPatientName(p);
                      const pPhone = getPatientPhone(p);
                      const pGender = getPatientGender(p);
                      const pAge = getPatientAge(p);
                      const initial = (pName[0] || 'P').toUpperCase();

                      return (
                        <div
                          key={pId}
                          onClick={(e) => handleSelectPatient(p, e)}
                          className="p-3 flex items-center justify-between hover:bg-indigo-50/70 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                              {initial}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                {pName}
                              </p>
                              <p className="text-[11px] text-slate-400 font-medium">
                                📞 {pPhone} • {pGender} {pAge ? `• ${pAge}y` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Select &rarr;
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      No matching patients found in directory.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-white rounded-2xl border-2 border-emerald-500/80 flex items-center justify-between shadow-xs ring-1 ring-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center shrink-0">
                    {(getPatientName(selectedPatient)[0] || 'P').toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">
                        {getPatientName(selectedPatient)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Patient Selected
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      📞 {getPatientPhone(selectedPatient)} • {getPatientGender(selectedPatient)}
                      {getPatientAge(selectedPatient) ? ` • ${getPatientAge(selectedPatient)} yrs` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearPatient}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
            {errors.patientId && <p className="text-red-500 text-xs font-bold mt-1">{errors.patientId}</p>}
          </div>

          {/* Section 2: Treating Doctor & Payment Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-indigo-600" /> Treating Doctor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value);
                  setErrors((prev) => ({ ...prev, doctorId: null }));
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500"
              >
                <option value="">Select Doctor...</option>
                {safeDoctors.map((doc, docIdx) => {
                  const docId = String(doc._id || doc.id || `doc-${docIdx}`);
                  const docName = safeString(doc.full_name) || safeString(doc.name) || 'Doctor';
                  const docSpec = safeString(doc.specialization) || 'Skin Care Practitioner';
                  return (
                    <option key={docId} value={docId}>
                      {docName} ({docSpec})
                    </option>
                  );
                })}
              </select>
              {errors.doctorId && <p className="text-red-500 text-xs font-bold mt-1">{errors.doctorId}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Invoice Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500"
              >
                <option value="Paid">Paid (Payment Received)</option>
                <option value="Pending">Pending (Payment Awaited)</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Payment Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 3: Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Skin Treatments &amp; Services <span className="text-red-500">*</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-indigo-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Service Row
              </button>
            </div>

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[2fr_0.6fr_1fr_0.8fr_0.4fr] gap-2 px-3 mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Service / Procedure</span>
              <span>Qty</span>
              <span>Rate ({RUPEE})</span>
              <span>Discount %</span>
              <span></span>
            </div>

            {/* Item Rows */}
            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 sm:p-2.5 bg-slate-50 sm:bg-slate-50/70 border border-slate-200/80 rounded-2xl grid grid-cols-1 sm:grid-cols-[2fr_0.6fr_1fr_0.8fr_0.4fr] gap-2 items-center">
                  <div>
                    <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase block mb-1">Procedure</label>
                    <select
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500"
                    >
                      <option value="">Select Service / Treatment...</option>
                      {COMMON_SKIN_SERVICES.map((srv) => (
                        <option key={srv} value={srv}>{srv}</option>
                      ))}
                    </select>

                    {item.description === 'Custom Treatment / Other' && (
                      <input
                        type="text"
                        placeholder="Enter custom service name..."
                        value={customDescriptions[idx] || ''}
                        onChange={(e) => setCustomDescriptions({ ...customDescriptions, [idx]: e.target.value })}
                        className="mt-1.5 w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                      />
                    )}
                  </div>

                  <div>
                    <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase block mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateItem(idx, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>

                  <div>
                    <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase block mb-1">Rate ({RUPEE})</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={item.rate}
                      onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>

                  <div>
                    <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase block mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={item.discount}
                      onChange={(e) => updateItem(idx, 'discount', Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {errors.items && <p className="text-red-500 text-xs font-bold mt-1.5">{errors.items}</p>}
          </div>

          {/* Section 4: Live Summary & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receipt Remarks / Notes (Optional)
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Paid via reception UPI QR code. Follow-up appointment scheduled for next Tuesday."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Calculations Card */}
            <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                <span>Subtotal (Line Items)</span>
                <span className="font-extrabold text-slate-800">{fmt(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <span>GST / Tax Rate (%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value={0}>0% (Tax Exempt)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST (Standard)</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>
              </div>

              {taxPercent > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                  <span>Computed Tax ({taxPercent}%)</span>
                  <span className="font-extrabold text-slate-800">{fmt(taxAmount)}</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-black text-slate-900 block leading-tight">Total Bill Amount</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Auto-calculated by backend</span>
                </div>
                <span className="text-xl font-black text-indigo-700 font-mono">
                  {fmt(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Generating Bill...' : `Generate Invoice (${fmt(totalAmount)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────── Indian Currency to Words Converter ─────────────── */
function amountToWords(num) {
  const n = Math.round(Number(num || 0));
  if (n <= 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(val) {
    let str = '';
    if (val >= 100) {
      str += ones[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val >= 20) {
      str += tens[Math.floor(val / 10)] + ' ';
      val %= 10;
    }
    if (val > 0) {
      str += ones[val] + ' ';
    }
    return str;
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  if (crore > 0) words += convertChunk(crore) + 'Crore ';
  if (lakh > 0) words += convertChunk(lakh) + 'Lakh ';
  if (thousand > 0) words += convertChunk(thousand) + 'Thousand ';
  if (remainder > 0) words += convertChunk(remainder);

  return `INR ${words.trim()} Only`;
}

/* ─────────────── Invoice Detail / Executive Print Modal ─────────────── */
function InvoiceDetailModal({ invoiceId, initialData, onClose, onStatusUpdated, canProcessBilling = true }) {
  const [invoice, setInvoice] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      setLoading(true);
      invoiceService.getInvoiceById(invoiceId)
        .then((res) => setInvoice(res.data))
        .catch((err) => {
          console.error('Failed to load invoice details:', err);
          toast.error('Failed to load complete invoice details');
        })
        .finally(() => setLoading(false));
    }
  }, [invoiceId]);

  const handleMarkAsPaid = async (paymentMethod = 'UPI') => {
    if (!invoice?._id) return;
    setUpdating(true);
    try {
      const res = await invoiceService.updateInvoiceStatus(invoice._id, {
        status: 'Paid',
        paymentMethod: paymentMethod,
        notes: `Marked Paid via ${paymentMethod} on ${new Date().toLocaleDateString()}`
      });
      toast.success('Invoice marked as Paid successfully!');
      setInvoice(res.data);
      if (onStatusUpdated) onStatusUpdated(res.data);
    } catch (err) {
      toast.error('Failed to update invoice status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!invoice && !loading) return null;

  const invoiceDateStr = new Date(invoice?.createdAt || invoice?.invoiceDate || Date.now())
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const dueDateStr = invoice?.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const patientName = safeString(invoice?.patient?.full_name) || safeString(invoice?.patientName) || safeString(invoice?.patient?.name) || 'Patient';
  const patientPhone = safeString(invoice?.patient?.phone) || safeString(invoice?.patientPhone) || 'N/A';
  const patientGender = safeString(invoice?.patient?.gender) || '';
  const patientAge = invoice?.patient?.age ? `${invoice.patient.age} Yrs` : '';
  const patientIdVal = invoice?.patientId || invoice?.patient?._id || 'N/A';

  const doctorName = safeString(invoice?.doctor?.full_name) || safeString(invoice?.doctorName) || safeString(invoice?.doctor?.name) || 'Doctor';
  const doctorSpec = safeString(invoice?.doctor?.specialization) || 'Skin Care Practitioner';
  const paymentMode = safeString(invoice?.paymentMethod) || 'Cash';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:inset-auto">
      {/* Dynamic Print Stylesheet Scoped to this Modal */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            z-index: 99999999 !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-auto max-h-[96vh] flex flex-col border border-slate-200 print:shadow-none print:border-none print:max-w-none print:max-h-none print:w-full print:rounded-none">
        
        {/* On-Screen Modal Navigation Header (Hidden on Paper Print) */}
        <div className="no-print bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-xl shadow-inner">
              🦷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                  Tax Invoice Preview
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {invoice?.invoiceNumber || 'INV-DRAFT'}
                </span>
              </div>
              <h3 className="text-sm font-black text-white mt-0.5">
                Skin Care Clinic &bull; Treatment Billing
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─────────────── Printable A4 Tax Invoice Document ─────────────── */}
        <div
          id="printable-invoice"
          className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible"
        >
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm font-bold flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              Loading complete invoice & patient profile...
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto print:max-w-none">
              
              {/* 1. Header Section: Clinic Branding & Tax Invoice Metadata */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
                {/* Clinic Left Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                      D
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                        Skin<span className="text-blue-600">Clinic</span> Care
                      </h1>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Dermatology &bull; Skin Health &bull; Aesthetic Care
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 font-medium pt-2 leading-relaxed">
                    <p>📍 104-106, Health City Enclave, Medical Boulevard, Mumbai, MH - 400001</p>
                    <p>📞 Clinic contact: +91 98765 43210 &bull; ✉️ care@skinclinic.com</p>
                    <p className="font-bold text-slate-800 mt-1">
                      GSTIN: <span className="font-mono">27AABCT3518Q1ZV</span> &bull; State Code: 27 (Maharashtra) &bull; Reg: MH-MUM-2024-8841
                    </p>
                  </div>
                </div>

                {/* Invoice Right Title & Numbers */}
                <div className="text-left sm:text-right shrink-0 space-y-1 sm:self-start">
                  <span className="inline-block bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded">
                    Tax Invoice / Medical Receipt
                  </span>
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Number</span>
                    <span className="text-lg font-black font-mono text-blue-700 tracking-tight">
                      {invoice.invoiceNumber || 'INV-2026-001'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    <p><span className="text-slate-400 font-bold">Date:</span> {invoiceDateStr}</p>
                    {dueDateStr && (
                      <p><span className="text-amber-700 font-bold">Due Date:</span> {dueDateStr}</p>
                    )}
                  </div>
                  <div className="pt-1">
                    <StatusBadge status={invoice.status} />
                  </div>
                </div>
              </div>

              {/* 2. Patient & Doctor 2-Column Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Billed To (Patient Information)
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900">
                    {patientName}
                  </h4>
                  <div className="text-xs text-slate-600 font-medium mt-1 space-y-0.5">
                    <p><span className="text-slate-400 font-bold">Phone:</span> {patientPhone}</p>
                    <p>
                      <span className="text-slate-400 font-bold">Details:</span>{' '}
                      {[patientGender, patientAge].filter(Boolean).join(' • ') || 'N/A'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      <span className="text-slate-400 font-sans font-bold">Patient ID:</span> {patientIdVal}
                    </p>
                  </div>
                </div>

                {/* Doctor Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Treating Skin Care Practitioner
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900">
                    {doctorName}
                  </h4>
                  <div className="text-xs text-slate-600 font-medium mt-1 space-y-0.5">
                    <p className="text-blue-700 font-bold">{doctorSpec}</p>
                    <p><span className="text-slate-400 font-bold">Dept:</span> Skin Care &amp; Aesthetics</p>
                    <p>
                      <span className="text-slate-400 font-bold">Payment Mode:</span>{' '}
                      <span className="font-bold text-slate-800 uppercase">{paymentMode}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Treatment & Procedure Line Items Table */}
              <div>
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider">
                        <th className="py-3 px-3 text-center w-12">#</th>
                        <th className="py-3 px-4">Treatment / Procedure Description</th>
                        <th className="py-3 px-3 text-center w-16">Qty</th>
                        <th className="py-3 px-3 text-right w-24">Rate ({RUPEE})</th>
                        <th className="py-3 px-3 text-right w-20">Disc %</th>
                        <th className="py-3 px-4 text-right w-28">Amount ({RUPEE})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {(invoice.items || []).map((it, idx) => {
                        const lineAmount = it.amount !== undefined
                          ? it.amount
                          : it.qty * it.rate * (1 - (it.discount || 0) / 100);
                        return (
                          <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                            <td className="py-3 px-3 text-center text-slate-400 font-bold font-mono">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <p className="font-black text-slate-900">{it.description}</p>
                              <p className="text-[10px] text-slate-400">Skin care service &bull; Code: SC-{100 + idx}</p>
                            </td>
                            <td className="py-3 px-3 text-center font-bold">{it.qty}</td>
                            <td className="py-3 px-3 text-right font-mono text-slate-700">{fmt(it.rate)}</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-600">
                              {it.discount > 0 ? `${it.discount}%` : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                              {fmt(lineAmount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Financial Calculations & Amount in Words */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Left: Words, Mode & Tax Notes */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Total Amount in Words
                    </span>
                    <p className="font-extrabold text-slate-900 italic leading-snug">
                      {amountToWords(invoice.totalAmount)}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 text-[11px] text-slate-600 leading-relaxed">
                    <p className="font-bold text-blue-900 mb-0.5">ℹ️ Medical Tax Benefit &amp; Insurance</p>
                    <p>
                      Please retain this invoice for your records. Coverage for skin-care services varies by policy; confirm eligibility with your insurer.
                    </p>
                  </div>

                  {invoice.notes && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Clinical Notes:</span>
                      <p className="font-medium mt-0.5">{invoice.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right: Detailed Numerical Calculations Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Procedure Subtotal</span>
                    <span className="font-mono font-bold text-slate-800">{fmt(invoice.subtotal)}</span>
                  </div>

                  {invoice.taxAmount > 0 ? (
                    <>
                      <div className="flex justify-between text-slate-500 font-medium text-[11px]">
                        <span>CGST ({(invoice.taxPercent || 18) / 2}%)</span>
                        <span className="font-mono">{fmt(invoice.taxAmount / 2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium text-[11px]">
                        <span>SGST ({(invoice.taxPercent || 18) / 2}%)</span>
                        <span className="font-mono">{fmt(invoice.taxAmount / 2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-500 font-medium text-[11px]">
                      <span>Tax / GST (0%)</span>
                      <span className="font-mono">{RUPEE}0.00</span>
                    </div>
                  )}

                  <div className="border-t-2 border-slate-900 pt-3 mt-2 flex justify-between items-baseline">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                        Net Total Payable
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">Inclusive of all hospital charges</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black font-mono text-blue-700">
                      {fmt(invoice.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Signatures & Official Hospital Stamp */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 items-end text-xs">
                <div>
                  <div className="border-b border-slate-300 w-44 mb-1.5" />
                  <p className="font-bold text-slate-800">Patient / Attendant Signature</p>
                  <p className="text-[10px] text-slate-400">Received treatment &amp; bill copy</p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="w-36 h-12 border border-dashed border-blue-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50/30 mb-1.5">
                    Official Stamp
                  </div>
                  <p className="font-black text-slate-900">{doctorName}</p>
                  <p className="text-[10px] text-slate-500">Authorized Skin Care Practitioner &bull; Skin Clinic</p>
                </div>
              </div>

              {/* 6. Legal Terms & Warm Note */}
              <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center leading-relaxed">
                <p>Terms: 1. Prescribed medications &amp; post-procedure guidelines should be strictly adhered to. 2. Inquiries: +91 98765 43210.</p>
                <p className="font-bold text-slate-600 mt-0.5">Thank you for choosing our skin care clinic. Wishing you healthy, radiant skin! ✨</p>
              </div>

            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar (Hidden on Paper Print) */}
        <div className="no-print px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {canProcessBilling && invoice?.status === 'Pending' && (
              <button
                onClick={() => handleMarkAsPaid('UPI')}
                disabled={updating}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {updating ? 'Updating...' : 'Mark as Paid (UPI / Cash)'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─────────────── Main Billing Component ─────────────── */
export const Billing = () => {
  const { hasPermission } = useAuth();
  const canProcessBilling = hasPermission ? Boolean(hasPermission('PROCESS_BILLING')) : false;

  // Real-time State
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch invoices from backend invoice-service API
  const fetchInvoices = useCallback(async (page = 1, status = statusFilter) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10
      };
      if (status && status !== 'ALL') {
        params.status = status;
      }
      const res = await invoiceService.getAllInvoices(params);
      if (res && res.success) {
        setInvoices(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
      toast.error('Failed to load invoices from server');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Initial load & filter change
  useEffect(() => {
    fetchInvoices(1, statusFilter);
  }, [statusFilter, fetchInvoices]);

  // KPI Calculations
  const totalRevenue = useMemo(() => {
    return invoices.filter((i) => i.status === 'Paid').reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  }, [invoices]);

  const totalPending = useMemo(() => {
    return invoices.filter((i) => i.status === 'Pending').reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  }, [invoices]);

  const totalOverdue = useMemo(() => {
    return invoices.filter((i) => i.status === 'Overdue').reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  }, [invoices]);

  // Client-side search match (over fetched items)
  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const invNum = safeString(inv.invoiceNumber).toLowerCase();
      const patient = (safeString(inv.patient?.full_name) || safeString(inv.patientName) || safeString(inv.patient?.name)).toLowerCase();
      const doctor = (safeString(inv.doctor?.full_name) || safeString(inv.doctorName) || safeString(inv.doctor?.name)).toLowerCase();
      const service = (safeString(inv.items?.[0]?.description) || safeString(inv.service)).toLowerCase();
      return invNum.includes(q) || patient.includes(q) || doctor.includes(q) || service.includes(q);
    });
  }, [invoices, search]);

  // Delete invoice handler
  const handleDeleteInvoice = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await invoiceService.deleteInvoice(deleteConfirmId);
      toast.success('Invoice deleted successfully');
      setDeleteConfirmId(null);
      fetchInvoices(pagination.page);
    } catch (err) {
      toast.error('Failed to delete invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-28 sm:pb-32 md:pb-8">
      {/* ── Invoice Creation Modal with Error Boundary ── */}
      <InvoiceErrorBoundary onClose={() => setShowFormModal(false)}>
        <InvoiceFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => fetchInvoices(1)}
        />
      </InvoiceErrorBoundary>

      {/* ── View / Print Modal ── */}
      {selectedInvoiceId && (
        <InvoiceDetailModal
          invoiceId={selectedInvoiceId}
          initialData={selectedInvoiceData}
          onClose={() => { setSelectedInvoiceId(null); setSelectedInvoiceData(null); }}
          onStatusUpdated={() => fetchInvoices(pagination.page)}
          canProcessBilling={canProcessBilling}
        />
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Cancel &amp; Delete Invoice?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Are you sure you want to delete this invoice record? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Keep Invoice
              </button>
              <button
                onClick={handleDeleteInvoice}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-gradient-to-b before:from-cyan-500 before:to-teal-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20 shrink-0 ring-4 ring-cyan-50">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Billing &amp; Invoices</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                Live Service
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Track real-time patient payments, collections &amp; outstanding dues.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => fetchInvoices(pagination.page)}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-600' : ''}`} />
          </button>

          {canProcessBilling && (
            <button
              onClick={() => setShowFormModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-600/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Invoice
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Overview Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Total Collected"
          value={fmt(totalRevenue)}
          sub={`${invoices.filter((i) => i.status === 'Paid').length} paid invoices`}
          icon={DollarSign}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          trend="+15%"
        />
        <KpiCard
          title="Pending Payments"
          value={fmt(totalPending)}
          sub={`${invoices.filter((i) => i.status === 'Pending').length} awaiting payment`}
          icon={Clock}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <KpiCard
          title="Overdue Dues"
          value={fmt(totalOverdue)}
          sub={`${invoices.filter((i) => i.status === 'Overdue').length} overdue bills`}
          icon={AlertCircle}
          colorClass="text-red-500"
          bgClass="bg-red-50"
        />
        <KpiCard
          title="Total Invoices"
          value={pagination.total || invoices.length}
          sub="Recorded on system"
          icon={FileText}
          colorClass="text-cyan-600"
          bgClass="bg-cyan-50"
        />
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice # (e.g. INV-2026-001), patient name or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'Paid', 'Pending', 'Overdue', 'Cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === s
                  ? s === 'ALL'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : s === 'Paid'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : s === 'Pending'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : s === 'Overdue'
                    ? 'bg-red-500 text-white border-red-500 shadow-xs'
                    : 'bg-slate-600 text-white border-slate-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Invoices Data Table ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-[1.2fr_1.8fr_1.4fr_1.2fr_1fr_1.1fr_0.8fr_0.8fr] px-6 py-3.5 bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-500">
          <span>Invoice #</span>
          <span>Patient</span>
          <span>Service / Procedure</span>
          <span>Treating Doctor</span>
          <span>Date</span>
          <span>Total Amount</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto opacity-75" />
              <p className="text-xs font-bold text-slate-500">Loading invoices from billing service...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">
                🧾
              </div>
              <h4 className="text-sm font-bold text-slate-800">No invoices found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No billing records match your current filter. Click &ldquo;Create Invoice&rdquo; to generate a new bill.
              </p>
              {canProcessBilling && (
                <button
                  onClick={() => setShowFormModal(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-xs hover:from-cyan-700 hover:to-teal-700 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Generate First Bill
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ── Mobile Native App Invoices Cards (< lg) ── */}
              <div className="lg:hidden divide-y divide-slate-100 bg-slate-50/40 p-2.5 sm:p-3 space-y-2.5">
                {filteredInvoices.map((inv) => {
                  const patientName = inv.patient?.full_name || inv.patientName || 'Patient';
                  const doctorName = inv.doctor?.full_name || inv.doctorName || 'Doctor';
                  const primaryService = inv.items?.[0]?.description || inv.service || 'Skin care service';
                  const extraItemsCount = (inv.items?.length || 1) - 1;
                  const formattedDate = new Date(inv.createdAt || inv.invoiceDate || Date.now()).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const phone = inv.patient?.phone || inv.patientPhone || '';
                  const invNumber = inv.invoiceNumber || `INV-${String(inv._id || '').slice(-6).toUpperCase()}`;

                  return (
                    <div
                      key={inv._id || inv.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3"
                    >
                      {/* Row 1: Invoice # & Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-100 shrink-0">
                            <Receipt className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-mono text-xs font-black text-slate-900 tracking-tight">{invNumber}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">• {inv.paymentMethod || 'Cash'}</span>
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>

                      {/* Row 2: Patient Info with 1-Tap Call */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {patientName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 text-sm truncate">{patientName}</p>
                            <p className="text-[11px] text-slate-400 font-medium truncate">{phone || 'No phone'}</p>
                          </div>
                        </div>

                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors shrink-0"
                            title="Call Patient"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Row 3: Service & Doctor Details */}
                      <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold text-[10px] uppercase">Service:</span>
                          <span className="font-bold text-slate-800 text-[11px] truncate max-w-[200px]">
                            {primaryService}
                            {extraItemsCount > 0 && ` (+${extraItemsCount} more)`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold text-[10px] uppercase">Doctor:</span>
                          <span className="font-bold text-cyan-700 text-[11px] truncate">Dr. {doctorName}</span>
                        </div>
                      </div>

                      {/* Row 4: Prominent Amount & Date */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Due</span>
                          <span className="text-base font-black text-slate-900 font-mono tracking-tight">
                            {fmt(inv.totalAmount || inv.amount)}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {formattedDate}
                        </span>
                      </div>

                      {/* Row 5: Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(inv._id);
                            setSelectedInvoiceData(inv);
                          }}
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View / Print Invoice</span>
                        </button>

                        {canProcessBilling && (
                          <button
                            onClick={() => setDeleteConfirmId(inv._id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Desktop Rows (>= lg) ── */}
              <div className="hidden lg:block divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const patientName = inv.patient?.full_name || inv.patientName || 'Patient';
                  const doctorName = inv.doctor?.full_name || inv.doctorName || 'Doctor';
                  const primaryService = inv.items?.[0]?.description || inv.service || 'Skin care service';
                  const extraItemsCount = (inv.items?.length || 1) - 1;
                  const formattedDate = new Date(inv.createdAt || inv.invoiceDate || Date.now()).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={inv._id || inv.id}
                      className="p-4 sm:px-6 grid grid-cols-[1.2fr_1.8fr_1.4fr_1.2fr_1fr_1.1fr_0.8fr_0.8fr] items-center hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Column 1: Invoice Number */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-cyan-100">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-900 font-mono block">
                            {inv.invoiceNumber || `INV-${String(inv._id || '').slice(-6).toUpperCase()}`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {inv.paymentMethod || 'Cash'}
                          </span>
                        </div>
                      </div>

                      {/* Column 2: Patient */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {patientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                            {patientName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium truncate">
                            {inv.patient?.phone || inv.patientPhone || 'No phone'}
                          </p>
                        </div>
                      </div>

                      {/* Column 3: Service */}
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-700 truncate block">
                          {primaryService}
                        </span>
                        {extraItemsCount > 0 && (
                          <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.2 rounded-md inline-block mt-0.5">
                            +{extraItemsCount} more item{extraItemsCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Column 4: Doctor */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          Dr. {doctorName}
                        </span>
                      </div>

                      {/* Column 5: Date */}
                      <div className="text-xs text-slate-500 font-medium">
                        {formattedDate}
                      </div>

                      {/* Column 6: Amount */}
                      <div>
                        <span className="text-sm font-black text-slate-900 font-mono block">
                          {fmt(inv.totalAmount || inv.amount)}
                        </span>
                        {inv.taxAmount > 0 && (
                          <span className="text-[10px] text-slate-400 font-semibold block">
                            incl. {fmt(inv.taxAmount)} tax
                          </span>
                        )}
                      </div>

                      {/* Column 7: Status */}
                      <div>
                        <StatusBadge status={inv.status} />
                      </div>

                      {/* Column 8: Actions */}
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(inv._id);
                            setSelectedInvoiceData(inv);
                          }}
                          className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all cursor-pointer border border-slate-200"
                          title="View & Print Bill"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canProcessBilling && (
                          <button
                            onClick={() => setDeleteConfirmId(inv._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Table Footer with Real Pagination ── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredInvoices.length}</span> of{' '}
            <span className="font-bold text-slate-800">{pagination.total || filteredInvoices.length}</span> recorded bills
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInvoices(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs font-bold text-slate-700 px-2 font-mono">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchInvoices(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      {canProcessBilling && (
        <button
          onClick={() => setShowFormModal(true)}
          className="md:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-3.5 rounded-full shadow-lg shadow-cyan-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Create Invoice"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};

export default Billing;
