import { axiosInstance } from './axiosInstance';

/**
 * Safely extracts the auth token from localStorage
 */
const getAuthToken = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      const token = parsed?.token || parsed?.data?.token || parsed?.accessToken || parsed?.data?.accessToken;
      if (token) return token;
    }
  } catch (e) {
    console.warn('Error parsing user token from localStorage:', e);
  }
  return localStorage.getItem('token') || '';
};

/**
 * Generates Authorization header config
 */
const getAuthConfig = (extraConfig = {}) => {
  const token = getAuthToken();
  return {
    ...extraConfig,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraConfig.headers || {})
    }
  };
};

export const invoiceService = {
  /**
   * 1. Get all invoices with pagination & optional filters
   * @param {Object} params - { page, limit, status, patientId, doctorId, startDate, endDate }
   */
  getAllInvoices: async (params = {}) => {
    try {
      const config = getAuthConfig({ params });
      const response = await axiosInstance.get('/invoices', config);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  /**
   * 2. Get single invoice details by ID
   * @param {string} id - Invoice Mongo ID
   */
  getInvoiceById: async (id) => {
    try {
      const config = getAuthConfig();
      const response = await axiosInstance.get(`/invoices/${id}`, config);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice ${id}:`, error);
      throw error;
    }
  },

  /**
   * 3. Create a new invoice (Bill Generation)
   * @param {Object} invoiceData - { patientId, doctorId, appointmentId, items, taxPercent, paymentMethod, status, dueDate, notes }
   */
  createInvoice: async (invoiceData) => {
    try {
      const config = getAuthConfig();
      const response = await axiosInstance.post('/invoices', invoiceData, config);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  /**
   * 4. Update status & payment method (e.g. mark as Paid)
   * @param {string} id - Invoice Mongo ID
   * @param {Object} statusData - { status, paymentMethod, notes }
   */
  updateInvoiceStatus: async (id, statusData) => {
    try {
      const config = getAuthConfig();
      const response = await axiosInstance.patch(`/invoices/${id}`, statusData, config);
      return response.data;
    } catch (error) {
      console.error(`Error updating invoice status for ${id}:`, error);
      throw error;
    }
  },

  /**
   * 5. Delete or cancel an invoice
   * @param {string} id - Invoice Mongo ID
   */
  deleteInvoice: async (id) => {
    try {
      const config = getAuthConfig();
      const response = await axiosInstance.delete(`/invoices/${id}`, config);
      return response.data;
    } catch (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      throw error;
    }
  }
};

export default invoiceService;
