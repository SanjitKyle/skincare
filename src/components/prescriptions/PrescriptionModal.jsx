import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  X, Plus, Trash2, Pill, Stethoscope, User, Calendar, 
  AlertTriangle, FileText, CheckCircle2, ChevronDown, Clock, ShieldAlert, Heart
} from 'lucide-react';
import { ContextProvider } from '../../context/store';
import { 
  createPrescription, 
  updatePrescription, 
  DOSAGE_FORMS, 
  FREQUENCIES, 
  MEAL_TIMINGS, 
  DURATION_UNITS, 
  MEDICATION_ROUTES, 
  PRESCRIPTION_STATUSES
} from '../../services/prescriptions';

const emptyMedication = () => ({
  medicineName: '',
  genericName: '',
  dosageForm: 'Tablet',
  strength: '500mg',
  dosage: '1 tablet',
  frequency: 'TDS',
  frequencyDetails: '1-1-1 (Morning, Afternoon, Night)',
  timing: 'After Food',
  duration: { value: 5, unit: 'Days' },
  quantity: 15,
  route: 'Oral',
  instructions: 'Take after food with water',
  isGenericSubstitutable: true
});

export const PrescriptionModal = ({
  isOpen,
  onClose,
  initialData = null,
  onSuccess
}) => {
  const { token, Patients, Doctors } = useContext(ContextProvider);

  const safePatients = useMemo(() => {
    if (Array.isArray(Patients)) return Patients;
    if (Array.isArray(Patients?.data)) return Patients.data;
    if (Array.isArray(Patients?.patients)) return Patients.patients;
    if (Array.isArray(Patients?.data?.data)) return Patients.data.data;
    return [];
  }, [Patients]);

  const safeDoctors = useMemo(() => {
    if (Array.isArray(Doctors)) return Doctors;
    if (Array.isArray(Doctors?.data)) return Doctors.data;
    if (Array.isArray(Doctors?.doctors)) return Doctors.doctors;
    if (Array.isArray(Doctors?.data?.data)) return Doctors.data.data;
    return [];
  }, [Doctors]);

  // Form State
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosisText, setDiagnosisText] = useState('');
  const [toothNumbersText, setToothNumbersText] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [bloodPressure, setBloodPressure] = useState('120/80 mmHg');
  const [pulseRate, setPulseRate] = useState('72 bpm');
  const [weight, setWeight] = useState('65 kg');
  const [medications, setMedications] = useState([emptyMedication()]);
  const [diagnosticTestsText, setDiagnosticTestsText] = useState('');
  const [generalAdvice, setGeneralAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [status, setStatus] = useState('active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill form on open or when initialData changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setPatientId(initialData.patientId?._id || initialData.patientId || '');
      setDoctorId(initialData.doctorId?._id || initialData.doctorId || '');
      setAppointmentId(initialData.appointmentId || '');
      setChiefComplaint(initialData.chiefComplaint || '');
      setDiagnosisText(Array.isArray(initialData.diagnosis) ? initialData.diagnosis.join(', ') : (initialData.diagnosis || ''));
      setToothNumbersText(Array.isArray(initialData.toothNumbers) ? initialData.toothNumbers.join(', ') : '');
      setAllergiesText(Array.isArray(initialData.patientAllergiesSnapshot) ? initialData.patientAllergiesSnapshot.join(', ') : '');
      setBloodPressure(initialData.vitalsSnapshot?.bloodPressure || '');
      setPulseRate(initialData.vitalsSnapshot?.pulseRate || '');
      setWeight(initialData.vitalsSnapshot?.weight || '');
      setMedications(Array.isArray(initialData.medications) && initialData.medications.length > 0 ? initialData.medications : [emptyMedication()]);
      setDiagnosticTestsText(Array.isArray(initialData.diagnosticTestsAdvised) ? initialData.diagnosticTestsAdvised.join(', ') : '');
      setGeneralAdvice(initialData.generalAdvice || '');
      setFollowUpDate(initialData.followUpDate ? initialData.followUpDate.split('T')[0] : '');
      setFollowUpInstructions(initialData.followUpInstructions || '');
      setStatus(initialData.status || 'active');
    } else {
      setPatientId(safePatients[0]?._id || safePatients[0]?.id || '');
      setDoctorId(safeDoctors[0]?._id || safeDoctors[0]?.id || '');
      setAppointmentId('');
      setChiefComplaint('');
      setDiagnosisText('');
      setToothNumbersText('');
      setAllergiesText('');
      setBloodPressure('120/80 mmHg');
      setPulseRate('72 bpm');
      setWeight('65 kg');
      setMedications([emptyMedication()]);
      setDiagnosticTestsText('');
      setGeneralAdvice('Follow the skin-care routine and aftercare guidance discussed during your visit.');
      const d = new Date();
      d.setDate(d.getDate() + 5);
      setFollowUpDate(d.toISOString().split('T')[0]);
      setFollowUpInstructions('Follow-up review for treatment evaluation');
      setStatus('active');
    }
    setErrorMsg('');
  }, [isOpen, initialData, safePatients, safeDoctors]);

  if (!isOpen) return null;

  // Selected Patient Details
  const activePatient = safePatients.find((p) => String(p?._id || p?.id) === String(patientId));

  // Medication Handlers
  const handleAddMedication = () => {
    setMedications([...medications, emptyMedication()]);
  };

  const handleRemoveMedication = (index) => {
    if (medications.length === 1) return;
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index, field, value) => {
    const updated = [...medications];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index] = {
        ...updated[index],
        [parent]: {
          ...updated[index][parent],
          [child]: value
        }
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }

    // Auto update frequency details string when frequency changes
    if (field === 'frequency') {
      const freqObj = FREQUENCIES.find((f) => f.value === value);
      if (freqObj) {
        updated[index].frequencyDetails = freqObj.details;
      }
    }

    setMedications(updated);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) {
      setErrorMsg('Please select a patient.');
      return;
    }
    if (!doctorId) {
      setErrorMsg('Please select a doctor.');
      return;
    }
    if (medications.some((m) => !m.medicineName.trim())) {
      setErrorMsg('All medication items must have a medicine name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const diagnosisArray = diagnosisText
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const toothNumbersArray = toothNumbersText
      .split(',')
      .map((t) => Number(t.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    const allergiesArray = allergiesText
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const diagnosticTestsArray = diagnosticTestsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      patientId,
      doctorId,
      appointmentId: appointmentId || undefined,
      chiefComplaint: chiefComplaint.trim(),
      diagnosis: diagnosisArray.length > 0 ? diagnosisArray : ['Skin care consultation'],
      toothNumbers: toothNumbersArray,
      patientAllergiesSnapshot: allergiesArray,
      vitalsSnapshot: {
        bloodPressure: bloodPressure.trim(),
        pulseRate: pulseRate.trim(),
        weight: weight.trim()
      },
      medications: medications.map((m) => ({
        medicineName: m.medicineName.trim(),
        genericName: m.genericName?.trim() || '',
        dosageForm: m.dosageForm || 'Tablet',
        strength: m.strength?.trim() || '500mg',
        dosage: m.dosage?.trim() || '1 tablet',
        frequency: m.frequency || 'TDS',
        frequencyDetails: m.frequencyDetails || '1-1-1 (Morning, Afternoon, Night)',
        timing: m.timing || 'After Food',
        duration: {
          value: Number(m.duration?.value) || 5,
          unit: m.duration?.unit || 'Days'
        },
        quantity: Number(m.quantity) || 15,
        route: m.route || 'Oral',
        instructions: m.instructions?.trim() || '',
        isGenericSubstitutable: !!m.isGenericSubstitutable
      })),
      diagnosticTestsAdvised: diagnosticTestsArray,
      generalAdvice: generalAdvice.trim(),
      followUpDate: followUpDate || undefined,
      followUpInstructions: followUpInstructions.trim(),
      status
    };

    console.log('Sending Prescription Payload:', JSON.stringify(payload, null, 2));

    try {
      if (initialData?._id || initialData?.id) {
        await updatePrescription(token, initialData._id || initialData.id, payload);
      } else {
        await createPrescription(token, payload);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Prescription save error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save prescription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialData ? 'Edit Prescription' : 'New Medical Prescription'}
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Add treatment guidance, mapped skin areas, and product instructions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Patient & Doctor Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Patient *
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              >
                <option value="">Select Patient</option>
                {safePatients.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.full_name || p.name} {p.age ? `(${p.age}y)` : ''} - {p.phone || 'No Phone'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Prescribing Doctor *
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              >
                <option value="">Select Doctor</option>
                {safeDoctors.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>
                    {d.full_name || d.name} ({d.specialization || 'Skin Care Practitioner'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              >
                {PRESCRIPTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Clinical Details & Vitals */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Clinical Assessment & Vitals
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Chief Complaint</label>
                <input
                  type="text"
                  placeholder="e.g. Acne flare-up or skin irritation"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Diagnosis (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Acne, rosacea, or dryness"
                  value={diagnosisText}
                  onChange={(e) => setDiagnosisText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Treatment area IDs (from the skin map)</label>
                <input
                  type="text"
                  placeholder="e.g. 4, 5"
                  value={toothNumbersText}
                  onChange={(e) => setToothNumbersText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            {/* Vitals & Allergies Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-500" /> Allergies
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, NSAIDs"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-rose-50/50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-rose-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-emerald-500" /> Blood Pressure
                </label>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="120/80 mmHg"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Pulse Rate</label>
                <input
                  type="text"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(e.target.value)}
                  placeholder="72 bpm"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Weight</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="65 kg"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Medications Table / List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-600" /> Prescribed Medications ({medications.length})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Add product directions, usage instructions, and any required aftercare guidance.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMedication}
                className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-blue-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Medicine
              </button>
            </div>

            {/* Individual Medication Cards */}
            <div className="space-y-4">
              {medications.map((med, index) => (
                <div 
                  key={index}
                  className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 relative group"
                >
                  {/* Row Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      {index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(index)}
                      disabled={medications.length === 1}
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Main Grid for Medicine Attributes */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Medicine Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Amoxicillin / Augmentin"
                        value={med.medicineName}
                        onChange={(e) => handleMedicationChange(index, 'medicineName', e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Generic Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Amoxicillin Trihydrate"
                        value={med.genericName}
                        onChange={(e) => handleMedicationChange(index, 'genericName', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Dosage Form</label>
                      <select
                        value={med.dosageForm}
                        onChange={(e) => handleMedicationChange(index, 'dosageForm', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      >
                        {DOSAGE_FORMS.map((form) => (
                          <option key={form} value={form}>{form}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Frequency, Timing, Duration Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Strength</label>
                      <input
                        type="text"
                        placeholder="500mg"
                        value={med.strength}
                        onChange={(e) => handleMedicationChange(index, 'strength', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Frequency</label>
                      <select
                        value={med.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-blue-700 outline-none"
                      >
                        {FREQUENCIES.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Timing</label>
                      <select
                        value={med.timing}
                        onChange={(e) => handleMedicationChange(index, 'timing', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none"
                      >
                        {MEAL_TIMINGS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Duration</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min="1"
                          value={med.duration?.value || 5}
                          onChange={(e) => handleMedicationChange(index, 'duration.value', e.target.value)}
                          className="w-16 px-2 py-2 bg-white border border-slate-200 rounded-xl text-sm text-center font-bold text-slate-900 outline-none"
                        />
                        <select
                          value={med.duration?.unit || 'Days'}
                          onChange={(e) => handleMedicationChange(index, 'duration.unit', e.target.value)}
                          className="flex-1 px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                        >
                          {DURATION_UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="15"
                        value={med.quantity || ''}
                        onChange={(e) => handleMedicationChange(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Specific Instruction */}
                  <div>
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. Rinse warm saline water, take with lots of fluid)..."
                      value={med.instructions}
                      onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Advice, Diagnostic Tests & Follow-Up */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">General Advice & Home Care</label>
              <textarea
                rows="3"
                value={generalAdvice}
                onChange={(e) => setGeneralAdvice(e.target.value)}
                placeholder="e.g. Soft diet for 48 hours, avoid extreme hot/cold beverages..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white outline-none resize-none"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Diagnostic Tests Advised (comma separated)</label>
                <input
                  type="text"
                  value={diagnosticTestsText}
                  onChange={(e) => setDiagnosticTestsText(e.target.value)}
                  placeholder="e.g. IOPA X-Ray (#46), OPG, Blood Sugar (F/PP)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Note</label>
                  <input
                    type="text"
                    value={followUpInstructions}
                    onChange={(e) => setFollowUpInstructions(e.target.value)}
                    placeholder="e.g. Suture removal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>Saving Prescription...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Save Prescription
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
