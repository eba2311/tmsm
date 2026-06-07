import { useEffect, useRef } from 'react';
import { createTrackingSocket, createNotificationsSocket } from '../lib/socket';
import { useAuthStore } from './useAuthStore';
import toast from 'react-hot-toast';

export default function useSocket() {
  const { user, accessToken } = useAuthStore();
  const trackingRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Create sockets
    const tracking = createTrackingSocket({ accessToken });
    const notifications = createNotificationsSocket({ accessToken });

    trackingRef.current = tracking;
    notifRef.current = notifications;

    // Tracking handlers
    tracking.on('connect', () => console.log('[socket] tracking connected'));
    tracking.on('vehicles:init', (vehicles) => {
      console.log('[socket] vehicles:init', vehicles.length);
    });
    tracking.on('vehicle:location', (update) => {
      // Could update client cache / state here
      // For now, log
      // console.log('vehicle update', update);
    });

    // Notifications
    notifications.on('connect', () => console.log('[socket] notifications connected'));
    notifications.on('notification', (n) => {
      toast.success(n.title || 'Notification');
      try {
        window.dispatchEvent(new CustomEvent('notification:received', { detail: n }));
      } catch (e) {}
    });

    // Connect
    tracking.connect();
    notifications.connect();

    return () => {
      try { tracking.disconnect(); } catch (e) {}
      try { notifications.disconnect(); } catch (e) {}
    };
  }, [user, accessToken]);

  return {
    tracking: trackingRef,
    notifications: notifRef,
  };
}
