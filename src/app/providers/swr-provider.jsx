"use client";

import { SWRConfig } from "swr";
import { signOut } from "@/components/auth/DesktopAuthProvider";

const fetcher = async (url, options = {}) => {
  let authHeader = {};
  try {
    const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('inzeedo_session') : null;
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session?.accessToken) {
        authHeader = { "Authorization": `Bearer ${session.accessToken}` };
      }
    }
  } catch (e) {
    // Ignore parse errors
  }

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Trigger logout if session has expired or token is invalid
      const returnUrl = window.location.pathname + window.location.search;
      signOut({ callbackUrl: `/login?redirect=${encodeURIComponent(returnUrl)}` });
    }
    const error = new Error("An error occurred while fetching the data.");
    error.info = await res.json().catch(() => null);
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export function SWRProvider({ children }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        refreshInterval: 0,
        errorRetryCount: 3,
      }}
    >
      {children}
    </SWRConfig>
  );
}
