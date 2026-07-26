'use client';

import { useEffect, useCallback, useRef } from 'react';

// We manage a dictionary of channels to allow multiple distinct channels in the app without recreating them
const channels = {};

const getChannel = (channelName) => {
  if (typeof window === 'undefined') return null;
  if (!channels[channelName]) {
    channels[channelName] = new BroadcastChannel(channelName);
  }
  return channels[channelName];
};

/**
 * useBroadcast Hook
 * 
 * A robust hook to manage cross-tab or cross-window communication natively via the BroadcastChannel API.
 * 
 * @param {string} channelName - The unique name of the broadcast channel (e.g., 'erp-auth', 'erp-pos-sync').
 * @param {Function} onMessage - Callback function triggered when a message is received from another tab/window.
 * @returns {object} Object containing the `broadcast` function to send messages.
 */
export function useBroadcast(channelName = 'erp_global', onMessage) {
  const onMessageRef = useRef(onMessage);

  // Keep the latest callback ref fresh without triggering useEffect re-runs
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const channel = getChannel(channelName);
    if (!channel) return;

    const handleMessage = (event) => {
      // Execute the latest callback ref
      if (onMessageRef.current) {
        onMessageRef.current(event.data, event);
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      // Let the singleton class persist to avoid constantly opening/closing native connections
    };
  }, [channelName]);

  const broadcast = useCallback(
    (payload) => {
      const channel = getChannel(channelName);
      if (channel) {
        channel.postMessage(payload);
      }
    },
    [channelName]
  );

  return { broadcast };
}
