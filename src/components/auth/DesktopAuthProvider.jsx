'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDesktopSession, desktopLogout } from '@/lib/desktop-auth';
import { TermsModal } from './terms-modal';

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

    // Initial route handling for multi-window
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const initRoute = params.get('initRoute');
      if (initRoute && status === 'authenticated') {
        // Clear the param from URL to avoid re-navigation on refresh
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', newUrl);
        // Use window.location.href for a clean redirect within the new window
        window.location.href = initRoute;
      }
    }

    return () => { window.fetch = originalFetch; };
  }, [status]);

  const value = {
    data: session,
    status: status,
    update: async (newData) => {
      if (newData && typeof window !== 'undefined') {
        const current = getDesktopSession();
        if (current && current.user) {
          // Update specific fields
          if (newData.name) current.user.name = newData.name;
          if (newData.email) current.user.email = newData.email;
          if (newData.image) {
            current.user.image = newData.image;
            // Add a timestamp to break image cache when updated
            current.user.imageLastUpdated = Date.now();
          }
          
          localStorage.setItem('inzeedo_session', JSON.stringify(current));
          setSession({ ...current });
          return;
        }
      }
      const updated = getDesktopSession();
      setSession(updated);
      setStatus(updated ? 'authenticated' : 'unauthenticated');
    }
  };

  const handleTermsAccept = () => {
    if (typeof window !== 'undefined') {
      const currentSession = getDesktopSession();
      if (currentSession && currentSession.user) {
        currentSession.user.terms_accepted = true;
        localStorage.setItem('inzeedo_session', JSON.stringify(currentSession));
        setSession({ ...currentSession });
      }
    }
  };

  const showTerms = status === 'authenticated' && session?.user && !session.user.terms_accepted;

  return (
    <SessionContext.Provider value={value}>
      {showTerms && <TermsModal onAccept={handleTermsAccept} />}
      <div className={showTerms ? "blur-sm pointer-events-none select-none transition-all duration-700" : "transition-all duration-700"}>
        {children}
      </div>
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
