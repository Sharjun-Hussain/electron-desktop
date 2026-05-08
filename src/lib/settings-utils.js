/**
 * Safely merges incoming settings data into the current state.
 * Handles stringified JSON and recovers from corrupted index-keyed objects.
 * 
 * @param {Object} current - The current default/local state
 * @param {any} incoming - The data received from the API
 * @returns {Object} - The merged and cleaned settings object
 */
export const safeMergeSettings = (current, incoming) => {
    if (!incoming) return current;

    let data = incoming;

    // 1. Handle case where data is a JSON string
    if (typeof data === 'string' && data.trim()) {
        try {
            data = JSON.parse(data);
        } catch (e) {
            console.warn("Failed to parse settings string:", e);
            // If it's a non-JSON string, it's definitely not what we want
            return current;
        }
    }

    // 2. Handle corrupted index-keyed object (e.g., { "0": "{", "1": "n", ... })
    // This happens when a string is spread into an object.
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data);
        // Check if keys are sequential numbers starting from 0
        const isIndexMapped = keys.length > 0 && keys.every(key => !isNaN(key));

        if (isIndexMapped) {
            try {
                // Reconstruct the string from indexed values
                const reconstructed = keys
                    .sort((a, b) => Number(a) - Number(b))
                    .map(key => data[key])
                    .join('');

                data = JSON.parse(reconstructed);
                console.log("Successfully recovered corrupted settings data.");
            } catch (e) {
                console.warn("Attempted to recover settings from index-map but failed:", e);
                // Return current if recovery fails
                return current;
            }
        }
    }

    // 3. Final check: ensure data is an object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return current;
    }

    // Merge clean data into current defaults
    return { ...current, ...data };
};
