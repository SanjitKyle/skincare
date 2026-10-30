import { axiosInstance } from './axiosInstance';

/**
 * Fetch profile and subscription details for current logged-in clinic
 */
export const getMyClinic = async () => {
    try {
        const response = await axiosInstance.get('/clinics/me');
        return response.data;
    } catch (error) {
        console.error('Error fetching clinic profile:', error);
        throw error;
    }
};

/**
 * Update clinic details, contact info, letterhead, or logo
 */
export const updateMyClinic = async (clinicData) => {
    try {
        const response = await axiosInstance.patch('/clinics/me', clinicData);
        return response.data;
    } catch (error) {
        console.error('Error updating clinic profile:', error);
        throw error;
    }
};
