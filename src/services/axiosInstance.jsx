import axios from 'axios';

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://dentalbackend.kyleinfotech.co.in/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Auto-inject JWT Authorization header from localStorage on all outgoing requests
axiosInstance.interceptors.request.use(
    (config) => {
        try {
            const rawUser = localStorage.getItem('user');
            if (rawUser) {
                const parsed = JSON.parse(rawUser);
                const token =
                    parsed?.data?.token ||
                    parsed?.token ||
                    parsed?.accessToken ||
                    parsed?.data?.accessToken;
                if (token && !config.headers.Authorization && !config.headers.authorization) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (e) {
            console.warn('[axiosInstance] Error reading token from localStorage:', e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);
