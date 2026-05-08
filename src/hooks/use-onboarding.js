"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function useOnboarding(pageKey, steps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/onboarding`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        setStatus(data.data);
      } else {
        setStatus({ onboarding_completed: false, force_onboarding: false });
      }
    } catch (error) {
      console.warn("[Onboarding] Failed to fetch status:", error);
      setStatus({ onboarding_completed: false, force_onboarding: false });
    }
  }, [session]);

  const markAsComplete = useCallback(() => {
    // 1. Mark this specific page as done
    const finalKey = pageKey === "page_" ? "page_dashboard" : pageKey;
    localStorage.setItem(`onboarding_${finalKey}_done`, "true");
  }, [pageKey]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchStatus();
    }
  }, [session, fetchStatus, pageKey]); // Refresh on page change

  useEffect(() => {
    // 1. Initial Identity Gating
    if (!status || !session?.user?.id) {
      return;
    }
    
    // 2. Step Verification
    if (!steps || steps.length === 0) {
      return;
    }

    // 3. Evaluate Visibility Conditions
    const finalKey = pageKey === "page_" ? "page_dashboard" : pageKey;
    const isCompletedOnDevice = localStorage.getItem(`onboarding_${finalKey}_done`) === "true";
    
    // Default to DISABLED (opt-in)
    const rawPreference = localStorage.getItem("onboarding_disabled");
    const isUserDisabled = rawPreference === null ? true : rawPreference === "true";
    
    const isForceMode = status.force_onboarding === true;

    // RULE: Force mode ALWAYS wins. 
    // Otherwise, it only shows if the user has EXPLICITLY enabled it AND they haven't finished this specific page.
    const shouldShow = isForceMode || (!isUserDisabled && !isCompletedOnDevice);

    if (shouldShow) {
      // 4. Dynamic Step Filtering: Skip steps whose elements don't exist in the DOM
      const visibleSteps = steps.filter(step => {
        if (!step.element) return true;
        if (typeof step.element !== "string") return true;
        return !!document.querySelector(step.element);
      });

      if (visibleSteps.length === 0) {
        return;
      }

      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(0, 0, 0, 0.75)',
        steps: visibleSteps,
        onDestroyed: () => {
          if (!isForceMode) {
            markAsComplete();
          }
        },
      });

      // Stability delay to ensure all dynamic components are rendered
      const timer = setTimeout(() => {
        try {
          // Double check conditions right before driving
          const currentRawPref = localStorage.getItem("onboarding_disabled");
          const currentlyDisabled = currentRawPref === null ? true : currentRawPref === "true";
          
          if (!isForceMode && currentlyDisabled) {
            console.log(`[Onboarding] Aborting ${pageKey} - User recently disabled it.`);
            return;
          }

          driverObj.drive();
        } catch (err) {
          console.error(`[Onboarding] Driver error for ${pageKey}:`, err);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status, steps, pageKey, session?.user?.id]);

  return { status, refreshStatus: fetchStatus };
}
