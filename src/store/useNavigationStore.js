import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNavigationStore = create(
  persist(
    (set, get) => ({
      history: [],
      
      // Track the current path
      track: (path) => {
        const { history } = get();
        // Don't track same path twice in a row
        if (history[history.length - 1] === path) return;
        
        // If we are going "back" through our own stack, don't push
        // This is a simple heuristic
        set({ history: [...history, path].slice(-20) });
      },

      // Get the previous path and remove the current one
      getBackPath: () => {
        const { history } = get();
        if (history.length <= 1) return null;
        
        const newHistory = [...history];
        newHistory.pop(); // Remove current path
        const backPath = newHistory.pop(); // Get previous path
        
        // We don't update the state here, the track() call on the new page will handle it
        // Actually, we should probably update it to avoid loops
        set({ history: newHistory }); 
        return backPath;
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'navigation-storage',
      getStorage: () => localStorage,
    }
  )
);
