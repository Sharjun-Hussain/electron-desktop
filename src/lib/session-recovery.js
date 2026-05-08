/**
 * Session Recovery Utility
 * Handles saving and restoring work-in-progress data during session expiry
 */

const STORAGE_KEYS = {
    FORM_DATA: 'pos_temp_form_data',
    RETURN_URL: 'pos_return_url',
    LAST_ACTIVITY: 'pos_last_activity'
};

/**
 * Save current form data before redirecting
 * @param {string} path - The current pathname
 * @param {object} data - The form data to save
 */
export const saveSessionData = (path, data) => {
    try {
        const sessionData = {
            path,
            data,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(sessionData));
        localStorage.setItem(STORAGE_KEYS.RETURN_URL, path);
    } catch (error) {
        console.error('Error saving session data:', error);
    }
};

/**
 * Get saved session data for a specific path
 * @param {string} currentPath - The current pathname to check against
 * @returns {object|null} The saved data if valid and matches path
 */
export const getSessionData = (currentPath) => {
    try {
        const dataStr = localStorage.getItem(STORAGE_KEYS.FORM_DATA);
        if (!dataStr) return null;

        const sessionData = JSON.parse(dataStr);

        // Check if data belongs to current page
        if (sessionData.path !== currentPath) return null;

        // Check if data is too old (e.g., > 30 mins)
        const THIRTY_MINS = 30 * 60 * 1000;
        if (new Date().getTime() - sessionData.timestamp > THIRTY_MINS) {
            clearSessionData();
            return null;
        }

        return sessionData.data;
    } catch (error) {
        console.error('Error retrieving session data:', error);
        return null;
    }
};

/**
 * Clear saved session data
 */
export const clearSessionData = () => {
    localStorage.removeItem(STORAGE_KEYS.FORM_DATA);
    localStorage.removeItem(STORAGE_KEYS.RETURN_URL);
};

/**
 * Get the return URL after login
 */
export const getReturnUrl = () => {
    return localStorage.getItem(STORAGE_KEYS.RETURN_URL);
};
