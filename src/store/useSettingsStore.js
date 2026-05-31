import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * useSettingsStore - Handles UI-only preferences and global application state.
 * Functional business settings (POS, Receipt, Communication, etc.) are now 
 * persisted via the backend API using the useSettings hook (SWR).
 */
export const useSettingsStore = create(
    persist(
        (set) => ({
            // Global UI Settings
            global: {
                appName: 'Inzeedo POS',
                currency: 'LKR',
                language: 'en',
                theme: 'light',
                zoomLevel: 1,
                sidebarCollapsed: false,
                posLayout: 'modern', // 'modern' | 'classic'
            },
            // Business Settings (Synced from backend)
            business: {},
            // Receipt Settings (Synced from backend)
            receipt: {},
            // General Settings (Synced from backend)
            general: {},
            // Persisted Session for Offline Use
            session: null,
            
            setGlobalSettings: (settings) =>
                set((state) => ({
                    global: typeof settings === 'object' && settings !== null
                        ? { ...state.global, ...settings }
                        : state.global
                })),

            setSidebarCollapsed: (collapsed) => 
                set((state) => ({
                    global: { ...state.global, sidebarCollapsed: collapsed }
                })),

            setTheme: (theme) => 
                set((state) => ({
                    global: { ...state.global, theme: theme }
                })),

            setPosLayout: (layout) =>
                set((state) => ({
                    global: { ...state.global, posLayout: layout }
                })),

            setBusinessSettings: (settings) =>
                set(() => ({ 
                    business: typeof settings === 'object' && settings !== null ? settings : {} 
                })),

            setReceiptSettings: (settings) =>
                set(() => ({ 
                    receipt: typeof settings === 'object' && settings !== null ? settings : {} 
                })),

            setGeneralSettings: (settings) =>
                set(() => ({ 
                    general: typeof settings === 'object' && settings !== null ? settings : {} 
                })),

            setSession: (session) =>
                set(() => ({ 
                    session: typeof session === 'object' && session !== null ? session : null 
                })),
        }),
        {
            name: 'pos-ui-preferences-storage', 
            storage: createJSONStorage(() => localStorage),
        }
    )
);
