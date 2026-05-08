import { create } from 'zustand';

export const useBreadcrumbStore = create((set) => ({
    breadcrumbs: {}, // Map of segment -> label
    setBreadcrumb: (segment, label) =>
        set((state) => ({
            breadcrumbs: { ...state.breadcrumbs, [segment]: label }
        })),
    clearBreadcrumb: (segment) =>
        set((state) => {
            const newBreadcrumbs = { ...state.breadcrumbs };
            delete newBreadcrumbs[segment];
            return { breadcrumbs: newBreadcrumbs };
        }),
}));
