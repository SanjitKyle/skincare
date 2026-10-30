import { axiosInstance } from './axiosInstance';

const getAuthHeaders = (token) => {
  let authToken = token;
  if (!authToken) {
    try {
      const user = localStorage.getItem('user');
      const parsed = user ? JSON.parse(user) : null;
      authToken = parsed?.token || parsed?.data?.token || parsed?.accessToken || parsed?.data?.accessToken;
    } catch {
      authToken = null;
    }
  }
  return authToken ? { authorization: `Bearer ${authToken}` } : {};
};

/**
 * Get all enquiries with filtering and pagination
 * Query params: status, source, search, page, limit
 */
export const getEnquiries = async (token, params = {}) => {
  try {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'ALL')
    );
    const response = await axiosInstance.get('/enquiries', {
      headers: getAuthHeaders(token),
      params: cleanParams
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    throw error;
  }
};

/**
 * Get enquiry details by ID
 */
export const getEnquiryById = async (token, id) => {
  try {
    const response = await axiosInstance.get(`/enquiries/${id}`, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching enquiry ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new enquiry
 */
export const createEnquiry = async (token, enquiryData) => {
  try {
    const response = await axiosInstance.post('/enquiries', enquiryData, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error creating enquiry:', error);
    throw error;
  }
};

/**
 * Update enquiry details
 */
export const updateEnquiry = async (token, id, enquiryData) => {
  try {
    const response = await axiosInstance.put(`/enquiries/${id}`, enquiryData, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating enquiry ${id}:`, error);
    throw error;
  }
};

/**
 * Update enquiry status
 * Body: { status, cancellationReason }
 */
export const updateEnquiryStatus = async (token, id, { status, cancellationReason } = {}) => {
  try {
    const response = await axiosInstance.patch(
      `/enquiries/${id}/status`,
      { status, cancellationReason },
      {
        headers: getAuthHeaders(token)
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating status for enquiry ${id}:`, error);
    throw error;
  }
};

/**
 * Convert enquiry to patient / appointment
 * Body: { convertedPatientId, convertedAppointmentId, createPatient }
 */
export const convertEnquiry = async (token, id, data = { createPatient: true }) => {
  try {
    const response = await axiosInstance.post(`/enquiries/${id}/convert`, data, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error(`Error converting enquiry ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an enquiry
 */
export const deleteEnquiry = async (token, id) => {
  try {
    const response = await axiosInstance.delete(`/enquiries/${id}`, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting enquiry ${id}:`, error);
    throw error;
  }
};

