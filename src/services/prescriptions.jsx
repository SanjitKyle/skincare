import { axiosInstance } from './axiosInstance';

// Enums & Constants matching Backend Swagger Specification
export const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Mouthwash',
  'Gel',
  'Ointment',
  'Injection',
  'Drops',
  'Other'
];

export const FREQUENCIES = [
  { value: 'OD', label: 'OD (Once daily - 1-0-0)', details: '1-0-0 (Morning)' },
  { value: 'BD', label: 'BD (Twice daily - 1-0-1)', details: '1-0-1 (Morning, Night)' },
  { value: 'TDS', label: 'TDS (Thrice daily - 1-1-1)', details: '1-1-1 (Morning, Afternoon, Night)' },
  { value: 'QID', label: 'QID (Four times daily - 1-1-1-1)', details: '1-1-1-1 (Every 6 hours)' },
  { value: 'SOS', label: 'SOS (As needed / When required)', details: 'SOS (When in pain)' },
  { value: 'STAT', label: 'STAT (Immediate single dose)', details: 'Immediate single dose' },
  { value: 'HS', label: 'HS (At bedtime - 0-0-1)', details: '0-0-1 (At bedtime)' },
  { value: 'Custom', label: 'Custom frequency', details: 'As directed' }
];

export const MEAL_TIMINGS = [
  'After Food',
  'Before Food',
  'With Food',
  'Empty Stomach',
  'As Directed'
];

export const DURATION_UNITS = ['Days', 'Weeks', 'Months'];

export const MEDICATION_ROUTES = [
  'Oral',
  'Topical',
  'Sublingual',
  'Intravenous',
  'Intramuscular',
  'Rinse/Gargle'
];

export const PRESCRIPTION_STATUSES = [
  'draft',
  'active',
  'dispensed',
  'cancelled',
  'expired'
];

// Common Dental Medication Presets
export const COMMON_DENTAL_MEDICATIONS = [
  {
    medicineName: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    dosageForm: 'Capsule',
    strength: '500mg',
    dosage: '1 capsule',
    frequency: 'TDS',
    frequencyDetails: '1-1-1 (Morning, Afternoon, Night)',
    timing: 'After Food',
    duration: { value: 5, unit: 'Days' },
    quantity: 15,
    route: 'Oral',
    instructions: 'Complete the full course. Do not stop midway.',
    isGenericSubstitutable: true
  },
  {
    medicineName: 'Augmentin (Amoxyclav)',
    genericName: 'Amoxicillin + Clavulanic Acid',
    dosageForm: 'Tablet',
    strength: '625mg',
    dosage: '1 tablet',
    frequency: 'BD',
    frequencyDetails: '1-0-1 (Morning, Night)',
    timing: 'After Food',
    duration: { value: 5, unit: 'Days' },
    quantity: 10,
    route: 'Oral',
    instructions: 'Take with a glass of water after food.',
    isGenericSubstitutable: true
  },
  {
    medicineName: 'Ibuprofen + Paracetamol (Combiflam)',
    genericName: 'Ibuprofen 400mg + Paracetamol 325mg',
    dosageForm: 'Tablet',
    strength: '400mg/325mg',
    dosage: '1 tablet',
    frequency: 'SOS',
    frequencyDetails: 'SOS (When pain occurs, max 3 times/day)',
    timing: 'After Food',
    duration: { value: 3, unit: 'Days' },
    quantity: 6,
    route: 'Oral',
    instructions: 'Take only when in moderate to severe pain. Do not take on empty stomach.',
    isGenericSubstitutable: true
  },
  {
    medicineName: 'Ketorolac Tromethamine (Ketorol-DT)',
    genericName: 'Ketorolac Tromethamine Dispersible',
    dosageForm: 'Tablet',
    strength: '10mg',
    dosage: '1 tablet',
    frequency: 'SOS',
    frequencyDetails: 'SOS (For severe acute pain)',
    timing: 'After Food',
    duration: { value: 3, unit: 'Days' },
    quantity: 6,
    route: 'Oral',
    instructions: 'Dissolve in half a glass of water and drink. For severe dental pain.',
    isGenericSubstitutable: true
  },
  {
    medicineName: 'Chlorhexidine Gluconate Mouthwash (0.2%)',
    genericName: 'Chlorhexidine 0.2% w/v',
    dosageForm: 'Mouthwash',
    strength: '0.2%',
    dosage: '10ml',
    frequency: 'BD',
    frequencyDetails: '1-0-1 (Morning & Night after brushing)',
    timing: 'After Food',
    duration: { value: 7, unit: 'Days' },
    quantity: 1,
    route: 'Rinse/Gargle',
    instructions: 'Rinse undiluted 10ml in mouth for 60 seconds, then spit. Do not eat/drink for 30 mins.',
    isGenericSubstitutable: true
  },
  {
    medicineName: 'Metronidazole (Flagyl)',
    genericName: 'Metronidazole',
    dosageForm: 'Tablet',
    strength: '400mg',
    dosage: '1 tablet',
    frequency: 'TDS',
    frequencyDetails: '1-1-1 (Morning, Afternoon, Night)',
    timing: 'After Food',
    duration: { value: 5, unit: 'Days' },
    quantity: 15,
    route: 'Oral',
    instructions: 'Strictly avoid alcohol consumption during and 48 hours after treatment.',
    isGenericSubstitutable: true
  },
  {
    medicineName: 'Pantoprazole (Pan-40)',
    genericName: 'Pantoprazole Sodium',
    dosageForm: 'Tablet',
    strength: '40mg',
    dosage: '1 tablet',
    frequency: 'OD',
    frequencyDetails: '1-0-0 (Morning)',
    timing: 'Empty Stomach',
    duration: { value: 5, unit: 'Days' },
    quantity: 5,
    route: 'Oral',
    instructions: 'Take 30 minutes before breakfast to prevent gastric irritation.',
    isGenericSubstitutable: true
  },
  {
    medicineName: 'Choline Salicylate + Lignocaine Gel (Zytee)',
    genericName: 'Choline Salicylate + Lignocaine',
    dosageForm: 'Gel',
    strength: 'Topical Gel',
    dosage: 'Small dab',
    frequency: 'TDS',
    frequencyDetails: '1-1-1 (Apply 3-4 times daily)',
    timing: 'Before Food',
    duration: { value: 5, unit: 'Days' },
    quantity: 1,
    route: 'Topical',
    instructions: 'Apply gently on painful ulcer/gums 15 mins before meals for relief.',
    isGenericSubstitutable: true
  }
];

// ==================== API FUNCTIONS ====================

/**
 * Get all prescriptions
 * GET /api/prescriptions
 */
export const getPrescriptions = async (token) => {
  try {
    const response = await axiosInstance.get('/prescriptions', {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all prescriptions:', error);
    throw error;
  }
};

/**
 * Create a new prescription
 * POST /api/prescriptions
 */
export const createPrescription = async (token, prescriptionData) => {
  try {
    const response = await axiosInstance.post('/prescriptions', prescriptionData, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating prescription:', error);
    throw error;
  }
};

/**
 * Get all prescriptions for a specific patient
 * GET /api/prescriptions/patient/:patientId
 */
export const getPrescriptionsByPatient = async (token, patientId, status = '') => {
  try {
    const params = status ? { status } : {};
    const response = await axiosInstance.get(`/prescriptions/patient/${patientId}`, {
      params,
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching prescriptions by patient:', error);
    throw error;
  }
};

/**
 * Get all prescriptions written by a doctor
 * GET /api/prescriptions/doctor/:doctorId
 */
export const getPrescriptionsByDoctor = async (token, doctorId, status = '') => {
  try {
    const params = status ? { status } : {};
    const response = await axiosInstance.get(`/prescriptions/doctor/${doctorId}`, {
      params,
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching prescriptions by doctor:', error);
    throw error;
  }
};

/**
 * Get prescriptions associated with a specific appointment
 * GET /api/prescriptions/appointment/:appointmentId
 */
export const getPrescriptionsByAppointment = async (token, appointmentId) => {
  try {
    const response = await axiosInstance.get(`/prescriptions/appointment/${appointmentId}`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching prescriptions by appointment:', error);
    throw error;
  }
};

/**
 * Lookup prescription by human-readable Prescription Number (e.g. RX-20260904-0001)
 * GET /api/prescriptions/number/:prescriptionNumber
 */
export const getPrescriptionByNumber = async (token, prescriptionNumber) => {
  try {
    const response = await axiosInstance.get(`/prescriptions/number/${prescriptionNumber}`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error looking up prescription by number:', error);
    throw error;
  }
};

/**
 * Get single prescription details by MongoDB ID
 * GET /api/prescriptions/:id
 */
export const getPrescriptionById = async (token, id) => {
  try {
    const response = await axiosInstance.get(`/prescriptions/${id}`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching prescription details:', error);
    throw error;
  }
};

/**
 * Update an existing prescription
 * PUT /api/prescriptions/:id
 */
export const updatePrescription = async (token, id, prescriptionData) => {
  try {
    const response = await axiosInstance.put(`/prescriptions/${id}`, prescriptionData, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating prescription:', error);
    throw error;
  }
};

/**
 * Update prescription status (active, dispensed, cancelled, expired, etc.)
 * PATCH /api/prescriptions/:id/status
 */
export const updatePrescriptionStatus = async (token, id, status) => {
  try {
    const response = await axiosInstance.patch(`/prescriptions/${id}/status`, { status }, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating prescription status:', error);
    throw error;
  }
};

/**
 * Delete a prescription by ID
 * DELETE /api/prescriptions/:id
 */
export const deletePrescription = async (token, id) => {
  try {
    const response = await axiosInstance.delete(`/prescriptions/${id}`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting prescription:', error);
    throw error;
  }
};
