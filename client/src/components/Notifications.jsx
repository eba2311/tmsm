import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

export default function Notifications({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (e) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications((s) => s.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      toast.error('Failed to mark read');
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
          <li key={n._id} className={`p-2 rounded border ${n.isRead ? 'bg-gray-50' : 'bg-white'}`}>
            <div className="text-sm font-medium">{n.title}</div>
            <div className="text-xs text-gray-600">{n.message}</div>
            <div className="flex items-center justify-end mt-1">
              {!n.isRead && <button onClick={() => markRead(n._id)} className="text-xs text-blue-600">Mark read</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
