import { axiosInstance } from './axiosInstance';
export const CreatePatient = async (patientData, token) => {
    try {

        const response = await axiosInstance.post("/patients", patientData, {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }
    catch (error) {
        console.error('Error creating patient:', error);
        throw error;
    }
}

export const getPatients = async (token) => {
    try {
        const response = await axiosInstance.get("/patients", {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        return response;

    } catch (error) {
        console.log('error', error);
        throw error;

    }
}

export const EditPatients = async (token, id, patientData) => {
    try {
        const response = await axiosInstance.post(`/patients/${id}`, patientData, {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        return response.data;

    } catch (error) {
        throw error;
    }
}

export const DeletePatient = async (token, id) => {
    try {
        const response = await axiosInstance.post(`/patients/delete/${id}`, {}, {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}
