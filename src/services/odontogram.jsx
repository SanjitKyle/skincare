import { axiosInstance } from './axiosInstance';

// Get or auto-initialize active odontogram for a patient
export const getPatientOdontogram = async (token, patientId, dentitionType = 'permanent') => {
  try {
    const response = await axiosInstance.get(`/odontograms/patient/${patientId}`, {
      params: { dentitionType },
      headers: { authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching patient odontogram:', error);
    throw error;
  }
};

// Create a new odontogram explicitly
export const createOdontogram = async (token, data) => {
  try {
    const response = await axiosInstance.post('/odontograms', data, {
      headers: { authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating odontogram:', error);
    throw error;
  }
};

// Update complete odontogram for a patient
export const updatePatientOdontogram = async (token, patientId, data) => {
  try {
    const response = await axiosInstance.put(`/odontograms/patient/${patientId}`, data, {
      headers: { authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating patient odontogram:', error);
    throw error;
  }
};

// Update a specific tooth (condition, surfaces, notes, etc.)
export const updateTooth = async (token, patientId, toothNumber, toothData) => {
  try {
    const response = await axiosInstance.patch(`/odontograms/patient/${patientId}/tooth/${toothNumber}`, toothData, {
      headers: { authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating tooth:', error);
    throw error;
  }
};

// Record a dental procedure on a tooth
export const addProcedure = async (token, patientId, procedureData) => {
  try {
    const response = await axiosInstance.post(`/odontograms/patient/${patientId}/procedure`, procedureData, {
      headers: { authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error recording procedure:', error);
    throw error;
  }
};

// Reset a single tooth to sound condition
export const resetTooth = async (token, patientId, toothNumber) => {
  try {
    const response = await axiosInstance.post(`/odontograms/patient/${patientId}/tooth/${toothNumber}/reset`, {}, {
      headers: { authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error resetting tooth:', error);
    throw error;
  }
};

// Get DMFT index and dental summary stats
export const getSummary = async (token, patientId) => {
  try {
    const response = await axiosInstance.get(`/odontograms/patient/${patientId}/summary`, {
      headers: { authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting odontogram summary:', error);
    throw error;
  }
};

// Get audit history of changes
export const getHistory = async (token, patientId) => {
  try {
    const response = await axiosInstance.get(`/odontograms/patient/${patientId}/history`, {
      headers: { authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting odontogram history:', error);
    throw error;
  }
};
