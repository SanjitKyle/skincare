import { axiosInstance } from './axiosInstance';

export const createAppointment = async (token, appointmentData) => {
    try {
        const response = await axiosInstance.post("/appointments", appointmentData, {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
    }
};

export const getAppointments = async (token) => {
    try {
        const res = await axiosInstance.get("/appointments?all=true&limit=1000", {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        return res.data;
    } catch (error) {
        console.error('Error getting appointments:', error);
        throw error;
    }
};

export const getAppointmentById = async (token, id) => {
    try {
        const res = await axiosInstance.get(`/appointments/${id}`, {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        return res.data;
    } catch (error) {
        console.error('Error getting appointment:', error);
        throw error;
    }
};

export const updateAppointment = async (token, id, appointmentData) => {
    try {
        const response = await axiosInstance.post(`/appointments/${id}`, appointmentData, {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating appointment:', error);
        throw error;
    }
};

export const deleteAppointment = async (token, id) => {
    try {
        const response = await axiosInstance.post(`/appointments/delete/${id}`, {}, {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting appointment:', error);
        throw error;
    }
};
