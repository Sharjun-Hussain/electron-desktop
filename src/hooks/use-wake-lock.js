'use client';

import { useEffect, useRef } from 'react';

/**
 * useWakeLock
 * Prevents the screen from dimming or sleeping using the Screen Wake Lock API.
 * - Activates when `active` is true (e.g. on POS or customer-display screens)
 * - Auto re-acquires the lock when the tab becomes visible again (the browser
 *   automatically releases the lock when the tab is hidden)
 * - Silently degrades on browsers that don't support the API
 */
export function useWakeLock(active = false) {
    const wakeLockRef = useRef(null);

    const acquire = async () => {
        if (!active) return;
        if (!('wakeLock' in navigator)) return; // API not supported
        try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {
            // Silently ignore — can fail if the tab is hidden or device policy blocks it
            console.warn('[WakeLock] Could not acquire:', err.message);
        }
    };

    const release = async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
            } catch (_) {}
            wakeLockRef.current = null;
        }
    };

    useEffect(() => {
        if (active) {
            acquire();
        } else {
            release();
        }

        // Re-acquire when the tab regains visibility (browser drops lock on hide)
        const handleVisibilityChange = () => {
            if (active && document.visibilityState === 'visible') {
                acquire();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            release();
        };
    }, [active]);
}
