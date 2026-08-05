import axios from 'axios';
import { saveSessionData } from './session-recovery';

// create axios instance with base URL if needed
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

const api = axios.create({
    baseURL,
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        try {
            if (typeof window !== 'undefined') {
                const sessionStr = localStorage.getItem('inzeedo_session');
                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    if (session?.accessToken) {
                        config.headers['Authorization'] = `Bearer ${session.accessToken}`;
                    }
                }
            }
        } catch (e) {
            // ignore
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Removed 401 auto-redirect logic for electron desktop to prevent hard redirects
        return Promise.reject(error);
    }
);

export default api;
