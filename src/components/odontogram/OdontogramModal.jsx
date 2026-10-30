import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Save, RotateCcw, Activity, Stethoscope, 
  Trash2, User, Layers, Loader2, RefreshCw, ArrowRight, ArrowLeft
} from 'lucide-react';
import SkinTreatmentMap, { SKIN_REGIONS } from './SkinTreatmentMap';
import { CONDITION_COLORS } from './Tooth';
import { 
  getPatientOdontogram, 
  createOdontogram, 
  updatePatientOdontogram, 
  updateTooth, 
  resetTooth, 
} from '../../services/odontogram';

// Skin treatment options use the existing chart condition codes for API compatibility.
const PROCEDURE_PRESETS = [
  { name: 'Acne care plan', material: 'topical', code: 'SKIN-ACNE', defaultCost: 150, defaultStatus: 'caries' },
  { name: 'Hydration & barrier repair', material: 'serum', code: 'SKIN-HYDRATE', defaultCost: 120, defaultStatus: 'filled' },
  { name: 'Chemical peel', material: 'peel', code: 'SKIN-PEEL', defaultCost: 250, defaultStatus: 'crown' },
  { name: 'Laser therapy', material: 'laser', code: 'SKIN-LASER', defaultCost: 450, defaultStatus: 'root_canal' },
  { name: 'Skin irritation review', material: 'topical', code: 'SKIN-REVIEW', defaultCost: 100, defaultStatus: 'extracted' },
  { name: 'Scar revision', material: 'laser', code: 'SKIN-SCAR', defaultCost: 500, defaultStatus: 'implant' },
  { name: 'Fine-line treatment', material: 'serum', code: 'SKIN-LINES', defaultCost: 300, defaultStatus: 'fracture' },
  { name: 'Pigmentation treatment', material: 'serum', code: 'SKIN-PIGMENT', defaultCost: 220, defaultStatus: 'veneer' },
];

export const OdontogramModal = ({
  isOpen,
  onClose,
  initialData = null,
  onSave,
  patientsList = [],
  doctorsList = [],
  token = null,
}) => {
  // 1. Safe Array normalization
  const safePatients = useMemo(() => {
    if (Array.isArray(patientsList)) return patientsList;
    if (Array.isArray(patientsList?.data)) return patientsList.data;
    return [];
  }, [patientsList]);

  const safeDoctors = useMemo(() => {
    if (Array.isArray(doctorsList)) return doctorsList;
    if (Array.isArray(doctorsList?.data)) return doctorsList.data;
    return [];
  }, [doctorsList]);

  // State management
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [customPatientName, setCustomPatientName] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [dentitionType, setDentitionType] = useState('permanent');
  const [notation, setNotation] = useState('universal');
  const [mobileTab, setMobileTab] = useState('chart'); // 'chart' | 'procedures'
  const [activeTool, setActiveTool] = useState('caries');
  const [selectedToothFdi, setSelectedToothFdi] = useState(null);
  const [teethData, setTeethData] = useState({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Selected patient details
  const activePatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return safePatients.find((p) => String(p?._id || p?.id) === String(selectedPatientId)) || null;
  }, [safePatients, selectedPatientId]);

  // Calculate treated teeth list
  const treatedTeethList = useMemo(() => {
    if (!teethData || typeof teethData !== 'object') return [];
    return Object.values(teethData).filter((t) => t && typeof t === 'object' && t.status && t.status !== 'sound' && t.status !== 'healthy');
  }, [teethData]);

  const totalCost = treatedTeethList.reduce((acc, curr) => acc + (Number(curr?.cost) || 0), 0);
  const completedCount = treatedTeethList.filter((t) => t?.treatmentStatus === 'completed').length;
  const diagnosedCount = treatedTeethList.filter((t) => t?.treatmentStatus === 'diagnosed' || t?.treatmentStatus === 'planned').length;

  // Helper to convert backend array of teeth into frontend map
  const transformBackendTeethToMap = (backendTeeth = []) => {
    const map = {};
    if (Array.isArray(backendTeeth)) {
      backendTeeth.forEach((t) => {
        if (!t) return;
        const key = t.toothNumber;
        map[key] = {
          toothNumber: t.toothNumber,
          condition: t.condition || 'sound',
          status: t.condition || 'sound',
          surfaces: Array.isArray(t.surfaces) ? t.surfaces.map((s) => (typeof s === 'string' ? s : s?.surface || '')).filter(Boolean) : [],
          procedure: t.procedure || (t.condition === 'caries' ? 'Acne care plan' : ''),
          cost: t.cost || (t.condition === 'caries' ? 150 : t.condition === 'root_canal' ? 750 : t.condition === 'crown' ? 850 : 0),
          treatmentStatus: t.treatmentStatus || (t.condition === 'sound' ? 'completed' : 'diagnosed'),
          notes: t.notes || '',
          mobility: t.mobility || 0,
          isMissing: t.isMissing || t.condition === 'missing' || t.condition === 'extracted',
          hasRootCanal: t.hasRootCanal || t.condition === 'root_canal',
          hasCrown: t.hasCrown || t.condition === 'crown',
          hasImplant: t.hasImplant || t.condition === 'implant',
        };
      });
    }
    return map;
  };

  // Helper to transform frontend map back to backend Tooth array
  const transformMapToBackendTeeth = (mapObj = {}) => {
    return Object.values(mapObj).map((t) => {
      const condition = t.status || t.condition || 'sound';
      return {
        toothNumber: Number(t.toothNumber),
        condition: condition,
        surfaces: (t.surfaces || []).map((s) => ({
          surface: s,
          condition: condition,
          material: t.material || 'composite',
          status: t.treatmentStatus === 'completed' ? 'completed' : 'diagnosed',
        })),
        mobility: Number(t.mobility) || 0,
        isMissing: condition === 'missing' || condition === 'extracted' || !!t.isMissing,
        hasRootCanal: condition === 'root_canal' || !!t.hasRootCanal,
        hasCrown: condition === 'crown' || !!t.hasCrown,
        hasImplant: condition === 'implant' || !!t.hasImplant,
        notes: t.notes || '',
      };
    });
  };

  // Fetch patient odontogram from backend API when patient changes
  const fetchBackendOdontogram = async (patientId, dType) => {
    if (!token || !patientId) return;
    setIsLoading(true);
    try {
      const res = await getPatientOdontogram(token, patientId, dType);
      const data = res?.data || res;
      if (data) {
        if (data.teeth && Array.isArray(data.teeth)) {
          setTeethData(transformBackendTeethToMap(data.teeth));
        } else if (data.teeth && typeof data.teeth === 'object') {
          setTeethData(data.teeth);
        }
        if (data.generalNotes) setGeneralNotes(data.generalNotes);
        if (data.doctorId) setSelectedDoctorId(data.doctorId);
        if (data.dentitionType) setDentitionType(data.dentitionType);
      }
    } catch (err) {
      console.log('Using local chart buffer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize or fetch when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const pid = initialData.patientId || initialData.patient_id || '';
      setSelectedPatientId(pid);
      setCustomPatientName(initialData.patientName || '');
      setSelectedDoctorId(initialData.doctorId || '');
      setDentitionType(initialData.dentitionType || (initialData.chartType === 'pediatric' ? 'deciduous' : 'permanent'));
      setNotation(initialData.notation || 'universal');
      
      if (initialData.teeth) {
        if (Array.isArray(initialData.teeth)) {
          setTeethData(transformBackendTeethToMap(initialData.teeth));
        } else {
          setTeethData(initialData.teeth);
        }
      }
      setGeneralNotes(initialData.generalNotes || '');

      if (pid && token) {
        fetchBackendOdontogram(pid, initialData.dentitionType || 'permanent');
      }
    } else {
      const defaultPid = safePatients[0]?._id || safePatients[0]?.id || '';
      setSelectedPatientId(defaultPid);
      setCustomPatientName('');
      setSelectedDoctorId(safeDoctors[0]?._id || safeDoctors[0]?.id || '');
      setDentitionType('permanent');
      setTeethData({});
      setGeneralNotes('');
      setSelectedToothFdi(null);

      if (defaultPid && token) {
        fetchBackendOdontogram(defaultPid, 'permanent');
      }
    }
  }, [initialData, isOpen, token]);

  // Handle selecting a tooth (receives FDI number and Universal number)
  const handleSelectTooth = (fdiNum, universalNum) => {
    const toothKey = fdiNum;
    setSelectedToothFdi(toothKey);

    if (activeTool === 'sound' || activeTool === 'healthy') {
      const updated = { ...teethData };
      delete updated[toothKey];
      setTeethData(updated);

      if (token && selectedPatientId) {
        resetTooth(token, selectedPatientId, toothKey).catch((e) => console.log('Reset tooth error:', e));
      }
      return;
    }

    const matchingPreset = PROCEDURE_PRESETS.find((p) => p.defaultStatus === activeTool);
    const existing = teethData[toothKey] || {};

    const newToothData = {
      toothNumber: toothKey,
      universalNumber: universalNum,
      status: activeTool,
      condition: activeTool,
      surfaces: [],
      procedure: existing.procedure || matchingPreset?.name || 'Skin treatment',
      material: existing.material || matchingPreset?.material || 'composite',
      cost: existing.cost !== undefined ? existing.cost : (matchingPreset?.defaultCost || 150),
      treatmentStatus: existing.treatmentStatus || 'diagnosed',
      notes: existing.notes || '',
      isMissing: activeTool === 'missing' || activeTool === 'extracted',
      hasRootCanal: activeTool === 'root_canal',
      hasCrown: activeTool === 'crown',
      hasImplant: activeTool === 'implant',
    };

    setTeethData({
      ...teethData,
      [toothKey]: newToothData,
    });

    if (token && selectedPatientId) {
      updateTooth(token, selectedPatientId, toothKey, {
        toothNumber: toothKey,
        condition: activeTool,
        surfaces: newToothData.surfaces.map((s) => ({
          surface: s,
          condition: activeTool,
          material: newToothData.material,
          status: 'diagnosed',
        })),
        isMissing: newToothData.isMissing,
        hasRootCanal: newToothData.hasRootCanal,
        hasCrown: newToothData.hasCrown,
        hasImplant: newToothData.hasImplant,
        notes: newToothData.notes,
      }).catch((e) => console.log('Live patch tooth note:', e));
    }
  };

  // Update specific property on a tooth
  const updateToothProp = (toothKey, key, value) => {
    if (!teethData[toothKey]) return;
    setTeethData({
      ...teethData,
      [toothKey]: {
        ...teethData[toothKey],
        [key]: value,
      },
    });
  };

  // Remove a tooth from treatment plan
  const removeTooth = (toothKey) => {
    const updated = { ...teethData };
    delete updated[toothKey];
    setTeethData(updated);
    if (selectedToothFdi === toothKey) setSelectedToothFdi(null);

    if (token && selectedPatientId) {
      resetTooth(token, selectedPatientId, toothKey).catch((e) => console.log('Reset tooth error:', e));
    }
  };

  // Handle Save to Backend & State
  const handleSaveForm = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const patientName = activePatient?.full_name || customPatientName || initialData?.patientName || 'Walk-in Patient';
    const doctorObj = safeDoctors.find((d) => String(d?._id || d?.id) === String(selectedDoctorId));
    const doctorName = doctorObj?.full_name || doctorObj?.name || initialData?.doctorName || 'Dr. Assigned';

    const backendTeethPayload = transformMapToBackendTeeth(teethData);

    const fullPayload = {
      patientId: selectedPatientId || initialData?.patientId,
      doctorId: selectedDoctorId || initialData?.doctorId,
      dentitionType,
      generalNotes,
      teeth: backendTeethPayload,
    };

    if (token && selectedPatientId) {
      try {
        await updatePatientOdontogram(token, selectedPatientId, fullPayload);
      } catch (err) {
        console.log('Update fallback to createOdontogram:', err);
        try {
          await createOdontogram(token, fullPayload);
        } catch (createErr) {
          console.error('Backend save error:', createErr);
        }
      }
    }

    const record = {
      _id: initialData?._id || `odonto_${Date.now()}`,
      patientId: selectedPatientId,
      patientName,
      patientPhone: activePatient?.phone || initialData?.patientPhone || '',
      patientAge: activePatient?.age || 35,
      doctorId: selectedDoctorId,
      doctorName,
      chartType: dentitionType === 'deciduous' ? 'pediatric' : 'adult',
      dentitionType,
      notation,
      teeth: teethData,
      affectedCount: treatedTeethList.length,
      completedCount,
      plannedCount: diagnosedCount,
      totalCost,
      generalNotes,
      status: treatedTeethList.length === 0 ? 'Normal' : completedCount === treatedTeethList.length ? 'Completed' : 'In Progress',
      updatedAt: new Date().toISOString(),
    };

    if (onSave) onSave(record);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-[fadeIn_0.25s_ease-out]">
      <div className="bg-white w-full max-w-[1580px] h-[96vh] sm:h-auto sm:max-h-[94vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden">
        
        {/* CLEAN MODAL HEADER */}
        <div className="p-3.5 sm:px-6 sm:py-4 md:px-8 border-b border-slate-200 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {initialData ? `Skin treatment map: ${initialData.patientName || 'Patient'}` : 'Skin treatment plan'}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                  Select a treatment focus and tap an area on the map.
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer md:hidden shrink-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
            {/* Desktop Close Button */}
            <button
              onClick={onClose}
              className="hidden md:flex p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PATIENT CONTEXT BAR */}
        <div className="p-3 sm:px-6 sm:py-3 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 text-xs shrink-0">
          {/* Patient Selector */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <div className="p-1 rounded-lg bg-white border border-slate-200 text-blue-700 shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px] shrink-0">Patient:</span>
            {safePatients.length > 0 ? (
              <select
                value={selectedPatientId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setSelectedPatientId(pid);
                  if (pid) fetchBackendOdontogram(pid, dentitionType);
                }}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none cursor-pointer shadow-2xs w-full truncate"
              >
                <option value="">-- Select Patient --</option>
                {safePatients.map((p) => (
                  <option key={p?._id || p?.id || Math.random()} value={p?._id || p?.id}>
                    {p?.full_name || 'Patient'}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={customPatientName}
                onChange={(e) => setCustomPatientName(e.target.value)}
                placeholder="Enter patient name..."
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none shadow-2xs w-full"
              />
            )}

            {selectedPatientId && token && (
              <button
                type="button"
                onClick={() => fetchBackendOdontogram(selectedPatientId, dentitionType)}
                title="Sync from backend"
                className="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-white px-3 py-1 text-[11px] font-bold text-rose-800 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            {treatedTeethList.length} areas with a treatment plan
          </div>

          {/* Doctor Selector */}
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px] shrink-0">Practitioner:</span>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none cursor-pointer shadow-2xs w-full sm:w-auto truncate"
            >
              <option value="">-- Select Practitioner --</option>
              {safeDoctors.map((d) => (
                <option key={d?._id || d?.id || Math.random()} value={d?._id || d?.id}>
                  Dr. {d?.full_name || d?.name || 'Doctor'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* MOBILE SEGMENTED VIEW SWITCHER (CHART vs PROCEDURES) */}
        <div className="lg:hidden px-3 pt-2.5 pb-2 bg-white border-b border-slate-200 shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMobileTab('chart')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'chart'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Skin treatment map</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('procedures')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'procedures'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📋 Plan & Notes</span>
              {treatedTeethList.length > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.2 rounded-full">
                  {treatedTeethList.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* MODAL BODY (LEFT CHART CANVAS + RIGHT PROCEDURE PANEL) */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* MAIN CHART AREA */}
          <div className={`flex-1 min-h-0 p-3 sm:p-5 md:p-6 flex-col gap-3.5 sm:gap-5 overflow-y-auto bg-slate-50/30 ${
            mobileTab === 'chart' ? 'flex' : 'hidden lg:flex'
          }`}>
            
            {/* MODERN TOOL PALETTE (VIBRANT CLINICAL BRUSH) */}
            <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-3 sm:mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Treatment focus
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                  Choose a concern, then select an area on the map
                </span>
              </div>

              {/* Tool Pills Grid */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {[
                  { id: 'caries', label: 'Acne & breakouts', bg: 'bg-red-500', active: 'bg-red-500 text-white shadow-red-500/25 border-red-600', dot: 'bg-red-500' },
                  { id: 'filled', label: 'Hydration & barrier', bg: 'bg-blue-600', active: 'bg-blue-600 text-white shadow-blue-500/25 border-blue-700', dot: 'bg-blue-600' },
                  { id: 'crown', label: 'Chemical peel', bg: 'bg-amber-500', active: 'bg-amber-500 text-white shadow-amber-500/25 border-amber-600', dot: 'bg-amber-500' },
                  { id: 'root_canal', label: 'Laser therapy', bg: 'bg-orange-500', active: 'bg-orange-500 text-white shadow-orange-500/25 border-orange-600', dot: 'bg-orange-500' },
                  { id: 'extracted', label: 'Irritation review', bg: 'bg-slate-500', active: 'bg-slate-600 text-white shadow-slate-500/25 border-slate-700', dot: 'bg-slate-500' },
                  { id: 'implant', label: 'Scar revision', bg: 'bg-purple-600', active: 'bg-purple-600 text-white shadow-purple-500/25 border-purple-700', dot: 'bg-purple-600' },
                  { id: 'fracture', label: 'Fine-line treatment', bg: 'bg-pink-500', active: 'bg-pink-500 text-white shadow-pink-500/25 border-pink-600', dot: 'bg-pink-500' },
                  { id: 'veneer', label: 'Pigmentation care', bg: 'bg-cyan-500', active: 'bg-cyan-500 text-white shadow-cyan-500/25 border-cyan-600', dot: 'bg-cyan-500' },
                  { id: 'sound', label: 'Clear area', bg: 'bg-emerald-500', active: 'bg-slate-900 text-white shadow-slate-900/25 border-slate-900', dot: 'bg-emerald-500' },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold sm:font-black transition-all cursor-pointer border shadow-2xs ${
                      activeTool === tool.id
                        ? `${tool.active} shadow-md scale-105`
                        : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full ${activeTool === tool.id ? 'bg-white ring-2 ring-white/30' : tool.dot}`} />
                    {tool.label}
                  </button>
                ))}
              </div>

            </div>

            <SkinTreatmentMap
              teethData={teethData}
              selectedTooth={selectedToothFdi}
              onSelectTooth={handleSelectTooth}
            />

            {/* QUICK ACTIONS & RESET */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-white p-3.5 sm:p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-black text-slate-700 uppercase tracking-wider text-[10px] sm:text-[11px]">Condition Key:</span>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs"><span className="w-2.5 h-2.5 bg-red-500 rounded-md shadow-2xs" /> Acne care</div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs"><span className="w-2.5 h-2.5 bg-blue-600 rounded-md shadow-2xs" /> Hydration</div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs"><span className="w-2.5 h-2.5 bg-amber-400 rounded-md shadow-2xs" /> Chemical peel</div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs"><span className="w-2.5 h-2.5 bg-orange-500 rounded-md shadow-2xs" /> Laser therapy</div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs"><span className="w-2.5 h-2.5 bg-purple-600 rounded-md shadow-2xs" /> Scar revision</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear every marked skin area?')) setTeethData({});
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold transition-colors cursor-pointer border border-slate-200 w-full sm:w-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Treatment Map
              </button>
            </div>

            {/* MOBILE BOTTOM SUMMARY STRIP */}
            <div className="lg:hidden sticky bottom-0 left-0 right-0 p-2.5 bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg flex items-center justify-between gap-2 z-10 rounded-2xl mt-auto">
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-800 truncate">
                  {treatedTeethList.length > 0 ? `${treatedTeethList.length} Areas Planned` : 'No areas marked yet'}
                </div>
                <div className="text-[11px] font-bold text-blue-600">
                  Total: ${totalCost.toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileTab('procedures')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>View Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TREATMENT PLAN & PROCEDURES PANEL (RIGHT SIDEBAR) */}
          <div className={`w-full lg:w-[460px] xl:w-[480px] bg-slate-50/80 p-3.5 sm:p-5 md:p-6 flex-col justify-between overflow-y-auto ${
            mobileTab === 'procedures' ? 'flex flex-1 min-h-0' : 'hidden lg:flex'
          }`}>
            
            <div>
              {/* Back to Chart button on Mobile */}
              <button
                type="button"
                onClick={() => setMobileTab('chart')}
                className="lg:hidden flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 mb-3 px-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to treatment map</span>
              </button>

              {/* Header */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200/90 mb-3.5 sm:mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Treatment plan & care
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    {treatedTeethList.length} areas planned
                  </p>
                </div>
                <div className="text-right bg-white px-3 py-1.5 rounded-2xl border border-blue-100 shadow-2xs">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Total Fee</span>
                  <div className="text-lg sm:text-xl font-black text-blue-700">${totalCost.toLocaleString()}</div>
                </div>
              </div>

              {/* Treatment area cards */}
              {treatedTeethList.length === 0 ? (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-dashed border-slate-300 p-6 sm:p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 sm:mb-3">
                    <Activity className="w-5 sm:w-6 h-5 sm:h-6" />
                  </div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-wider">No areas marked</p>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-xs font-medium">
                    Choose a treatment focus and select an area on the map to add findings and care details.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] sm:max-h-[440px] overflow-y-auto pr-1">
                  {treatedTeethList.map((tooth) => {
                    const condKey = tooth.condition || tooth.status || 'sound';
                    const meta = CONDITION_COLORS[condKey] || CONDITION_COLORS.sound;
                    return (
                      <div
                        key={tooth.toothNumber}
                        className={`bg-white p-3.5 sm:p-4.5 rounded-2xl sm:rounded-3xl border transition-all relative overflow-hidden ${
                          selectedToothFdi === tooth.toothNumber
                            ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {/* Left Condition Color Accent Line */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                          style={{ backgroundColor: meta.bg }}
                        />

                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-2 pl-1">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-black text-[11px] sm:text-xs shadow-2xs">
                              {SKIN_REGIONS[tooth.toothNumber]?.label || `Area ${tooth.toothNumber}`}
                            </span>
                            <span
                              className="text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: `${meta.bg}15`, color: meta.border }}
                            >
                              {meta.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-1.5">
                            {/* Status Selector */}
                            <select
                              value={tooth.treatmentStatus || 'diagnosed'}
                              onChange={(e) => updateToothProp(tooth.toothNumber, 'treatmentStatus', e.target.value)}
                              className={`text-[10px] sm:text-[11px] font-black rounded-lg px-2 py-1 border focus:outline-none cursor-pointer ${
                                tooth.treatmentStatus === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              <option value="diagnosed">Diagnosed</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => removeTooth(tooth.toothNumber)}
                              className="p-1 sm:p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Procedure Name & Cost */}
                        <div className="grid grid-cols-3 gap-2 mt-2 pl-1">
                          <div className="col-span-2">
                            <label className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Treatment</label>
                            <input
                              type="text"
                              value={tooth.procedure || ''}
                              onChange={(e) => updateToothProp(tooth.toothNumber, 'procedure', e.target.value)}
                              placeholder="e.g. Acne care plan"
                              className="w-full text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Fee ($)</label>
                            <input
                              type="number"
                              value={tooth.cost !== undefined ? tooth.cost : ''}
                              onChange={(e) => updateToothProp(tooth.toothNumber, 'cost', Number(e.target.value))}
                              className="w-full text-xs font-black px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Notes */}
                        <input
                          type="text"
                          value={tooth.notes || ''}
                          onChange={(e) => updateToothProp(tooth.toothNumber, 'notes', e.target.value)}
                          placeholder="Skin assessment notes..."
                          className="w-full text-xs text-slate-600 px-2.5 py-1.5 mt-2 pl-1 bg-transparent border-b border-slate-200 focus:outline-none focus:border-blue-600 placeholder:text-slate-400"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* General Clinical Notes */}
              <div className="mt-4 pt-3.5 border-t border-slate-200/90">
                <label className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Skin assessment notes & recommendations
                </label>
                <textarea
                  rows="2"
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Add skin-care guidance, aftercare instructions, or follow-up notes..."
                  className="w-full text-xs font-semibold p-2.5 sm:p-3.5 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-800 shadow-2xs"
                />
              </div>
            </div>

            {/* ACTION BUTTONS (STICKY FOOTER) */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200/90 flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-300 bg-white text-slate-700 font-extrabold text-[11px] sm:text-xs hover:bg-slate-100 transition-colors uppercase tracking-wider cursor-pointer shadow-2xs disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveForm}
                disabled={isSaving}
                className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-black text-[11px] sm:text-xs shadow-lg shadow-cyan-600/25 transition-all flex items-center justify-center gap-1.5 sm:gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isSaving ? 'Saving...' : 'Save treatment plan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
