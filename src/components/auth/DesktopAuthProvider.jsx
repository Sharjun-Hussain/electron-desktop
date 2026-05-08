'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDesktopSession, desktopLogout } from '@/lib/desktop-auth';

const SessionContext = createContext(null);

export function DesktopAuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    if (typeof window !== 'undefined') return getDesktopSession();
    return null;
  });
  
  const [status, setStatus] = useState(() => {
    if (typeof window !== 'undefined') return getDesktopSession() ? 'authenticated' : 'unauthenticated';
    return 'loading';
  });

  useEffect(() => {
    // Re-verify session on mount
    const currentSession = getDesktopSession();
    setSession(currentSession);
    setStatus(currentSession ? 'authenticated' : 'unauthenticated');
    
    const { fetch: originalFetch } = window;
    window.fetch = async (...args) => {
      const sess = getDesktopSession();
      if (sess?.accessToken) {
        if (!args[1]) args[1] = { headers: {} };
        if (!args[1].headers) args[1].headers = {};
        args[1].headers['Authorization'] = `Bearer ${sess.accessToken}`;
      }

      const response = await originalFetch(...args);
      
      // If we get a 401, it means our session is invalid or expired
      if (response.status === 401 && !window.location.pathname.includes('/login')) {
        console.warn(`[DesktopAuth] 401 Unauthorized from ${args[0]}. Logging out...`);
        // Only logout if we actually have a session to clear, to avoid infinite loops
        if (getDesktopSession()) {
          desktopLogout();
        }
      }
      return response;
    };

    return () => { window.fetch = originalFetch; };
  }, []);

  const value = {
    data: session,
    status: status,
    update: async () => {
      const updated = getDesktopSession();
      setSession(updated);
      setStatus(updated ? 'authenticated' : 'unauthenticated');
    }
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// SAFE MOCK HOOKS
export const useSession = () => {
  try {
    const context = useContext(SessionContext);
    if (!context) return { data: null, status: 'loading' };
    return context;
  } catch (e) {
    return { data: null, status: 'loading' };
  }
};

export const signOut = () => {
  if (typeof window !== 'undefined') desktopLogout();
};

export const signIn = () => {
  if (typeof window !== 'undefined') window.location.href = '/login';
};
