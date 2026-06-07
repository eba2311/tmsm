import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { useAuthStore } from '../hooks/useAuthStore';
import toast from 'react-hot-toast';

export default function Notifications({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();

    const handleNotificationReceived = (event) => {
      const notification = event?.detail;
      if (notification && notification.id) {
        setNotifications((current) => {
          if (current.some((n) => n.id === notification.id)) return current;
          return [notification, ...current];
        });
      } else {
        fetchNotifications();
      }
    };

    const handleNotificationReadAll = () => {
      fetchNotifications();
    };

    window.addEventListener('notification:received', handleNotificationReceived);
    window.addEventListener('notification:read-all', handleNotificationReadAll);
    return () => {
      window.removeEventListener('notification:received', handleNotificationReceived);
      window.removeEventListener('notification:read-all', handleNotificationReadAll);
    };
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    const token = useAuthStore.getState().accessToken;
    try {
      if (!token) throw new Error('Not authenticated');
      const res = await api.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.data || []);
    } catch (e) {
      console.error('Notifications load failed:', e?.response?.data || e.message || e);
      toast.error(e?.response?.data?.message || e.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    const token = useAuthStore.getState().accessToken;
    try {
      if (!token) throw new Error('Not authenticated');
      await api.patch(`/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((s) => s.map(n => n.id === id ? { ...n, isRead: true } : n));
      window.dispatchEvent(new CustomEvent('notification:read', { detail: { id } }));
    } catch (e) {
      console.error('Mark notification read failed:', e?.response?.data || e.message || e);
      toast.error(e?.response?.data?.message || e.message || 'Failed to mark read');
    }
  }

  return (
    <div className="bg-white shadow-md rounded p-3 w-80">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold">Notifications</h4>
        <button onClick={onClose} className="text-sm text-gray-500">Close</button>
      </div>
      {loading && <div className="text-sm text-gray-500">Loading...</div>}
      {!loading && notifications.length === 0 && <div className="text-sm text-gray-500">No notifications</div>}
      <ul className="space-y-2 max-h-64 overflow-auto">
        {notifications.map(n => (
          <li key={n.id} className={`p-2 rounded border ${n.isRead ? 'bg-gray-50' : 'bg-white'}`}>
            <div className="text-sm font-medium">{n.title}</div>
            <div className="text-xs text-gray-600">{n.message}</div>
            <div className="flex items-center justify-end mt-1">
              {!n.isRead && <button onClick={() => markRead(n.id)} className="text-xs text-blue-600">Mark read</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
