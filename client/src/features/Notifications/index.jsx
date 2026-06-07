import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { useAuthStore } from '../../hooks/useAuthStore';
import toast from 'react-hot-toast';
import { Bell, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error('Not authenticated');
      const { data: res } = await api.get('/notifications', {
        params: { limit: 50 },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res;
    },
  });

  useEffect(() => {
    const handleNotificationReceived = () => {
      refetch();
    };

    window.addEventListener('notification:received', handleNotificationReceived);
    return () => window.removeEventListener('notification:received', handleNotificationReceived);
  }, [refetch]);

  const list = data?.data || [];
  const unread = data?.unread ?? 0;

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      window.dispatchEvent(new CustomEvent('notification:read'));
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      toast.success('All read');
      window.dispatchEvent(new CustomEvent('notification:read-all'));
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="space-y-5">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notifications
          </h1>
          <p className="page-subtitle">{unread ? `${unread} unread` : 'All caught up'}</p>
        </div>
        <button type="button" className="btn-secondary flex items-center gap-2 text-sm" onClick={() => markAll.mutate()} disabled={markAll.isPending || !unread}>
          <CheckCheck className="w-4 h-4" />
          Mark all read
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="space-y-2">
        {list.map((n) => (
          <div
            key={n.id}
            className={`card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${n.isRead ? 'opacity-70' : 'ring-1 ring-primary/20'}`}
          >
            <div>
              <p className="font-semibold text-sidebar">{n.title}</p>
              {n.titleAm && <p className="text-sm font-amharic text-gray-600">{n.titleAm}</p>}
              <p className="text-sm text-gray-600 mt-1">{n.message}</p>
              <p className="text-[11px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('en-GB', { timeZone: 'Africa/Addis_Ababa' })}</p>
            </div>
            {!n.isRead && (
              <button type="button" className="btn-primary !py-2 text-xs self-start" onClick={() => markRead.mutate(n.id)}>
                Mark read
              </button>
            )}
          </div>
        ))}
        {!isLoading && list.length === 0 && <p className="text-sm text-gray-500">No notifications.</p>}
      </div>
    </div>
  );
}
