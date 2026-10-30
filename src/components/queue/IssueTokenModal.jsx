import React, { useState, useContext, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  X, UserPlus, Users, Search, CheckCircle2, AlertCircle, 
  Stethoscope, Sparkles, Clock, ShieldAlert, Phone, User, 
  Calendar, ArrowRight, Tag, Ticket, Loader2, RefreshCw
} from 'lucide-react';
import { ContextProvider } from '../../context/store';
import { PRIORITY_LEVELS, getNextTokenNumber } from '../../services/queueStorage';
import { issueQueueToken, issueWalkInToken } from '../../services/queue';
import { getPatients } from '../../services/patients';

const SKIN_CARE_SERVICES = [
  'Skin consultation & assessment',
  'Acne or irritation concern',
  'Chemical peel session',
  'Laser skin treatment',
  'Hydration & barrier care',
  'Pigmentation care',
  'Scar revision consultation',
  'Sensitive skin review',
  'Fine-line treatment',
  'Post-treatment follow-up'
];

export const IssueTokenModal = ({ isOpen, onClose, onTokenCreated, currentQueue = [] }) => {
  const { Patients, Doctors, PatientCreate, token, getAllPatience } = useContext(ContextProvider);

  const [activeTab, setActiveTab] = useState('existing'); // 'existing' | 'new'

  // Existing Patient Search & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [localPatients, setLocalPatients] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const hasFetchedRef = useRef(false);

  // New Patient Form
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    saveToDatabase: true
  });

  // Shared Token Details
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [service, setService] = useState(SKIN_CARE_SERVICES[0]);
  const [customService, setCustomService] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Helper to calculate patient age if missing but DOB is present
  const getPatientAge = (p) => {
    if (p?.age !== undefined && p?.age !== null && p?.age !== '') return p.age;
    if (p?.date_of_birth) {
      const birthDate = new Date(p.date_of_birth);
      if (!Number.isNaN(birthDate.getTime())) {
        const today = new Date();
        let calculated = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculated--;
        }
        return calculated > 0 ? calculated : null;
      }
    }
    return null;
  };

  // Fetch clinic patients on modal open or on refresh
  const loadPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    try {
      if (getAllPatience) {
        const res = await getAllPatience();
        if (Array.isArray(res)) {
          setLocalPatients(res);
          return;
        }
      }
      if (token) {
        const res = await getPatients(token);
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data?.patients)
          ? res.data.patients
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        setLocalPatients(list);
      }
    } catch (err) {
      console.warn('Could not load clinic patients:', err);
    } finally {
      setIsLoadingPatients(false);
    }
  }, [getAllPatience, token]);

  useEffect(() => {
    if (isOpen) {
      setFormError('');
      // If we don't have patients in context or local state, trigger fetch once per modal session
      const contextHasPatients = (Array.isArray(Patients) && Patients.length > 0) ||
                                 (Array.isArray(Patients?.data) && Patients.data.length > 0) ||
                                 (Array.isArray(Patients?.patients) && Patients.patients.length > 0);
      if (!contextHasPatients && localPatients.length === 0 && !hasFetchedRef.current) {
        hasFetchedRef.current = true;
        loadPatients();
      }
    } else {
      hasFetchedRef.current = false;
    }
  }, [isOpen, Patients, localPatients.length, loadPatients]);

  // Extract safe list of patients from either context or local state
  const safePatients = useMemo(() => {
    let list = [];
    if (Array.isArray(Patients) && Patients.length > 0) list = Patients;
    else if (Array.isArray(Patients?.data) && Patients.data.length > 0) list = Patients.data;
    else if (Array.isArray(Patients?.patients) && Patients.patients.length > 0) list = Patients.patients;
    else if (Array.isArray(Patients?.data?.data) && Patients.data.data.length > 0) list = Patients.data.data;
    else if (Array.isArray(localPatients) && localPatients.length > 0) list = localPatients;
    return list;
  }, [Patients, localPatients]);

  // Extract safe list of doctors
  const safeDoctors = useMemo(() => {
    let list = [];
    if (Array.isArray(Doctors)) list = Doctors;
    else if (Array.isArray(Doctors?.data)) list = Doctors.data;
    else if (Array.isArray(Doctors?.doctors)) list = Doctors.doctors;
    else if (Array.isArray(Doctors?.data?.data)) list = Doctors.data.data;
    return list;
  }, [Doctors]);

  // Filter existing patients based on search; if empty query, show all available patients
  const filteredPatients = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return safePatients;
    const q = String(searchQuery).toLowerCase().trim();
    return safePatients.filter((p) => {
      if (!p) return false;
      const name = String(p.full_name || p.name || '').toLowerCase();
      const phone = String(p.phone || p.contact || '').toLowerCase();
      const id = String(p._id || p.id || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || id.includes(q);
    });
  }, [safePatients, searchQuery]);

  // Next Token Preview
  const nextToken = useMemo(() => getNextTokenNumber(currentQueue), [currentQueue]);

  if (!isOpen) return null;

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    let patientName = '';
    let phone = '';
    let age = '';
    let gender = 'Male';
    let patientId = null;
    let isNew = false;

    if (activeTab === 'existing') {
      if (!selectedPatient) {
        setFormError('Please search and select an existing patient, or switch to New Patient tab.');
        return;
      }
      patientName = selectedPatient.full_name || selectedPatient.name || 'Patient';
      phone = selectedPatient.phone || selectedPatient.contact || '';
      age = getPatientAge(selectedPatient) || selectedPatient.age || '';
      gender = selectedPatient.gender || 'Male';
      patientId = selectedPatient._id || selectedPatient.id || null;
      isNew = false;
    } else {
      if (!newPatient.name.trim()) {
        setFormError('Please enter the patient full name.');
        return;
      }
      if (!newPatient.phone.trim()) {
        setFormError('Please enter a contact phone number.');
        return;
      }
      patientName = newPatient.name.trim();
      phone = newPatient.phone.trim();
      age = newPatient.age ? Number(newPatient.age) : '';
      gender = newPatient.gender;
      isNew = true;

      // Optionally save into main patients directory
      if (newPatient.saveToDatabase && PatientCreate) {
        try {
          await PatientCreate({
            full_name: patientName,
            phone: phone,
            age: age,
            gender: gender,
            note: `Auto-registered via Walk-in OPD token on ${new Date().toLocaleDateString()}`
          });
        } catch (saveErr) {
          console.warn('Patient auto-save to database non-blocking error:', saveErr);
        }
      }
    }

    // Determine Doctor Name
    let doctorName = 'On-Duty Practitioner';
    if (selectedDoctorId) {
      const doc = safeDoctors.find((d) => String(d._id || d.id) === String(selectedDoctorId));
      if (doc) doctorName = doc.full_name || doc.name || `Dr. ${selectedDoctorId}`;
    } else if (safeDoctors.length > 0) {
      const firstDoc = safeDoctors[0];
      doctorName = firstDoc.full_name || firstDoc.name || 'Dr. Priya Sharma';
    }

    const finalService = customService.trim() ? customService.trim() : service;

    const tokenPayload = {
      id: `TOK-${Date.now().toString().slice(-5)}`,
      tokenNumber: nextToken.tokenNumber,
      tokenCode: nextToken.tokenCode,
      patientName,
      phone,
      age,
      gender,
      isNewPatient: isNew,
      patientId,
      doctorId: selectedDoctorId || (safeDoctors[0]?._id || safeDoctors[0]?.id || 'doc-1'),
      doctorName,
      service: finalService,
      priority,
      status: 'WAITING',
      issuedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: notes.trim()
    };

    setIsSubmitting(true);
    try {
      let createdToken;
      if (token) {
        const res = await issueQueueToken(tokenPayload, token);
        createdToken = res?.data || res || tokenPayload;
      } else {
        const res = await issueWalkInToken(tokenPayload);
        createdToken = res?.data || res || tokenPayload;
      }
      onTokenCreated(createdToken);
    } catch (apiErr) {
      console.warn('Backend issue token fallback:', apiErr);
      onTokenCreated(tokenPayload);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[96vh] sm:max-h-[94vh]">
        
        {/* ── Modal Header with Token Badge ── */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/15 flex items-center justify-center text-xl shadow-xs ring-1 ring-white/20 shrink-0">
              <Ticket className="w-5 h-5 text-white shrink-0" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug">Issue Clinic OPD Token</h2>
                <span className="px-2 py-0.5 rounded-full bg-white text-cyan-700 text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap shrink-0 shadow-xs">
                  Next: {nextToken.tokenCode}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-cyan-100 font-semibold mt-0.5 truncate sm:whitespace-normal">
                Register daily walk-in &amp; assign queue priority
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Patient Mode Switcher (Existing vs New Walk-in) ── */}
        <div className="px-3.5 sm:px-6 pt-3.5 sm:pt-4 pb-2 bg-slate-50/70 border-b border-slate-200/80">
          <div className="flex p-1 bg-slate-200/80 rounded-xl sm:rounded-2xl w-full gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab('existing'); setFormError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer text-center ${
                activeTab === 'existing'
                  ? 'bg-white text-cyan-800 shadow-sm shadow-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Existing Patient</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('new'); setFormError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer text-center ${
                activeTab === 'new'
                  ? 'bg-white text-cyan-800 shadow-sm shadow-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">New Walk-in</span>
            </button>
          </div>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              {formError}
            </div>
          )}

          {/* TAB 1: EXISTING PATIENT LOOKUP */}
          {activeTab === 'existing' && (
            <div className="space-y-3 bg-cyan-50/40 p-4 rounded-2xl border border-cyan-100/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-cyan-600" />
                  Select Registered Clinic Patient
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">
                    {safePatients.length} Registered
                  </span>
                  <button
                    type="button"
                    onClick={loadPatients}
                    disabled={isLoadingPatients}
                    title="Refresh Patients"
                    className="p-1 rounded-lg hover:bg-cyan-100 text-cyan-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingPatients ? 'animate-spin' : ''}`} />
                  </button>
                  {selectedPatient && (
                    <button 
                      type="button"
                      onClick={() => { setSelectedPatient(null); setSearchQuery(''); }}
                      className="text-[11px] font-bold text-cyan-600 hover:underline cursor-pointer ml-1"
                    >
                      Change Patient
                    </button>
                  )}
                </div>
              </div>

              {!selectedPatient ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type patient name, phone number, or ID to filter..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filtered suggestions list */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-xs">
                    {isLoadingPatients ? (
                      <div className="p-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                        <span className="text-xs font-semibold">Loading patients from database...</span>
                      </div>
                    ) : filteredPatients.length > 0 ? (
                      filteredPatients.map((p) => {
                        const calculatedAge = getPatientAge(p);
                        return (
                          <div
                            key={p._id || p.id}
                            onClick={() => handleSelectPatient(p)}
                            className="p-2.5 flex items-center justify-between hover:bg-cyan-50/70 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 font-black text-xs flex items-center justify-center shrink-0">
                                {String(p.full_name || p.name || 'P')[0]?.toUpperCase()}
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-800 group-hover:text-cyan-600 transition-colors truncate">
                                  {p.full_name || p.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium truncate">
                                  {String(p.phone || p.contact || 'No phone')} • {p.gender || 'Unknown'} {calculatedAge ? `• ${calculatedAge} yrs` : ''}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-cyan-600 px-2 py-1 rounded-md bg-cyan-50 group-hover:bg-cyan-600 group-hover:text-white transition-all shrink-0">
                              Select &rarr;
                            </span>
                          </div>
                        );
                      })
                    ) : safePatients.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 font-medium">
                        No registered patients found in clinic database yet.<br />
                        <span className="text-cyan-600 font-semibold cursor-pointer" onClick={() => setActiveTab('new')}>
                          Click here to enter walk-in patient details &rarr;
                        </span>
                      </div>
                    ) : (
                      <div className="p-5 text-center text-xs text-slate-400 font-medium">
                        No patient matching "<span className="text-slate-600 font-semibold">{searchQuery}</span>".<br />
                        <span className="text-cyan-600 font-semibold cursor-pointer" onClick={() => setActiveTab('new')}>
                          Switch to New Patient tab to register
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Selected Patient Pill */
                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center">
                      {String(selectedPatient.full_name || selectedPatient.name || 'P')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          {selectedPatient.full_name || selectedPatient.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          Verified Patient
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        📞 {String(selectedPatient.phone || selectedPatient.contact || 'N/A')} • {selectedPatient.gender || ''} {getPatientAge(selectedPatient) ? `• ${getPatientAge(selectedPatient)} yrs` : ''}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NEW PATIENT QUICK-ENTRY */}
          {activeTab === 'new' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="text-xs font-black uppercase tracking-wider text-slate-700">
                New Patient Walk-in Details
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Patient Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Chandra"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Mobile Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 35"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveToDatabase"
                  checked={newPatient.saveToDatabase}
                  onChange={(e) => setNewPatient({ ...newPatient, saveToDatabase: e.target.checked })}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <label htmlFor="saveToDatabase" className="text-xs text-slate-600 font-semibold cursor-pointer">
                  Save as permanent patient record in Clinic Directory
                </label>
              </div>
            </div>
          )}

          {/* ── PRIORITY SELECTOR CARDS (Key Feature for User) ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-cyan-600" />
                Queue Priority Level <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-bold text-cyan-600">
                Determines check-in order
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(PRIORITY_LEVELS).map((lvl, idx) => {
                const isSelected = priority === lvl.key;
                const isFifthCard = idx === 4;
                return (
                  <div
                    key={lvl.key}
                    onClick={() => setPriority(lvl.key)}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isFifthCard ? 'col-span-2 sm:col-span-1' : ''
                    } ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-50/80 shadow-xs ring-2 ring-cyan-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm sm:text-base">{lvl.iconText}</span>
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] font-black border shrink-0 ${lvl.badgeClass}`}>
                        Rank #{lvl.rank}
                      </span>
                    </div>
                    <div className="mt-1.5 sm:mt-2 min-w-0">
                      <p className={`text-[11px] sm:text-xs font-black truncate ${isSelected ? 'text-cyan-900' : 'text-slate-800'}`}>
                        {lvl.label}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-tight mt-0.5 line-clamp-1">
                        {lvl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── DOCTOR & SERVICE SELECTION ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-cyan-600 shrink-0" /> Assigned Doctor
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-500"
              >
                <option value="">Any Available Doctor (General Queue)</option>
                {safeDoctors.map((doc) => (
                  <option key={doc._id || doc.id} value={doc._id || doc.id}>
                    {doc.full_name || doc.name} ({doc.specialization || 'Skin Care Practitioner'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-cyan-600 shrink-0" /> Visit Reason / Skin Care Service
              </label>
              <select
                value={service}
                onChange={(e) => {
                  setService(e.target.value);
                  if (e.target.value !== 'Other Custom Issue') setCustomService('');
                }}
                className="w-full px-3 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-500"
              >
                {SKIN_CARE_SERVICES.map((srv) => (
                  <option key={srv} value={srv}>{srv}</option>
                ))}
                <option value="Other Custom Issue">Other Custom Issue</option>
              </select>
            </div>
          </div>

          {service === 'Other Custom Issue' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom Complaint / Service</label>
              <input
                type="text"
                placeholder="Describe the skin concern or requested treatment..."
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Internal Receptionist / Triage Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Swelling on lower right jaw for 2 days; allergic to penicillin"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-500"
            />
          </div>

          {/* ── Footer ── */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{isSubmitting ? 'Issuing Token...' : `Issue Token ${nextToken.tokenCode}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
