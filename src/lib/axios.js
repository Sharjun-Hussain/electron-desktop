import axios from 'axios';
import { saveSessionData } from './session-recovery';

// create axios instance with base URL if needed
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL,
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check for 401 Unauthorized or 403 Forbidden
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {

            // If we are on the client side
            if (typeof window !== 'undefined') {
                // In a real application, you might want to try to get a new session here
                // but NextAuth usually handles this automatically in the background.
                // If we get a 401 even after NextAuth's background refresh, it means the session is truly dead.

                const currentPath = window.location.pathname;

                // Don't loop if already on login
                if (!currentPath.includes('/login')) {
                    // Force a redirect to login
                    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
