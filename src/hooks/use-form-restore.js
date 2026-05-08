import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { saveSessionData, getSessionData, getReturnUrl, clearSessionData } from '@/lib/session-recovery';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Custom hook to handle form data persistence and restoration
 * @param {object} form - The react-hook-form instance
 * @param {string} storageKey - Unique key for local storage (optional, defaults to current path)
 */
export const useFormRestore = (form, storageKey = null, enabled = true) => {
    const pathname = usePathname();
    const key = storageKey || pathname;

    // 1. Auto-save form data on change (debounced)
    useEffect(() => {
        if (!enabled) return;
        
        const subscription = form.watch((value) => {
            saveSessionData(key, value);
        });

        return () => subscription.unsubscribe();
    }, [form, key, enabled]);

    // 2. Restore data on mount or when enabled changes
    useEffect(() => {
        if (!enabled) return;

        // Attempt to get saved data
        const savedData = getSessionData(key);

        if (savedData) {
            // Check if savedData is actually different from current values to avoid redundant toasts
            const currentValues = form.getValues();
            const hasChanges = Object.keys(savedData).some(k => {
                const saved = savedData[k];
                const current = currentValues[k];
                // Only consider it a change if it's a meaningful non-empty value
                return saved && saved !== current;
            });

            if (hasChanges) {
                try {
                    form.reset({ ...currentValues, ...savedData });
                } catch (error) {
                    console.error("Failed to restore form data:", error);
                }
            }
        }
    }, [form, key, enabled]); 

    return {
        clearSavedData: () => clearSessionData(key)
    };
};
