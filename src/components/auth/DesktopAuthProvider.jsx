'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDesktopSession, desktopLogout } from '@/lib/desktop-auth';
import { TermsModal } from './terms-modal';
import { useBroadcast } from '@/hooks/useBroadcast';

const SessionContext = createContext(null);

export function DesktopAuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    if (typeof window !== 'undefined') return getDesktopSession();
    return null;
  });
  
  const [status, setStatus] = useState(() => {
    // On the client, read synchronously from localStorage — never stay in 'loading'
    if (typeof window !== 'undefined') return getDesktopSession() ? 'authenticated' : 'unauthenticated';
    // SSR: return loading, will be resolved by useEffect after hydration
    return 'loading';
  });
  const [mounted, setMounted] = useState(false);

  // 1. Blueprint Implementation: Listen for cross-window security signals
  const { broadcast } = useBroadcast('erp_auth', (data) => {
    if (data?.type === 'LOGOUT') {
       console.log('[Broadcast] Remote logout signal received. Securing this window.');
       if (getDesktopSession()) {
         desktopLogout();
       }
    }
  });

  useEffect(() => {
    // Re-verify session on mount (resolves SSR 'loading' state)
    const currentSession = getDesktopSession();
    setSession(currentSession);
    setStatus(currentSession ? 'authenticated' : 'unauthenticated');
    setMounted(true);
    
    const { fetch: originalFetch } = window;
    window.fetch = async (...args) => {
      const sess = getDesktopSession();
      if (sess?.accessToken) {
        if (!args[1]) args[1] = { headers: {} };
        if (!args[1].headers) args[1].headers = {};
        args[1].headers['Authorization'] = `Bearer ${sess.accessToken}`;
      }

      const response = await originalFetch(...args);
      
      // Removed auto-logout on 401 for Electron Desktop to prevent hard redirects
      if (response.status === 401) {
        console.warn(`[DesktopAuth] 401 Unauthorized from ${args[0]}. Auto-redirect disabled.`);
      }
      
      return response;
    };

    return () => { window.fetch = originalFetch; };
  }, []);

  const value = {
    data: session,
    status: status,
    update: async (newData) => {
      if (newData && typeof window !== 'undefined') {
        const current = getDesktopSession();
        if (current && current.user) {
          // Patch specific profile fields if updating profile
          if (newData.name) current.user.name = newData.name;
          if (newData.email) current.user.email = newData.email;
          if (newData.image) {
            current.user.image = newData.image;
            current.user.imageLastUpdated = Date.now();
          }
          localStorage.setItem('inzeedo_session', JSON.stringify(current));
          setSession({ ...current });
          setStatus('authenticated');
          return;
        }
      }
      // Full re-read (e.g. after SessionExpiredModal re-login)
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
