import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { useAuthStore } from '../../hooks/useAuthStore';
import toast from 'react-hot-toast';
import { Bus, MapPin, Clock, Navigation } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

function fmt(iso) {
  return new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Addis_Ababa' });
}

export default function DriverPanel() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const socketRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-schedules'],
    queryFn: async () => {
      const { data: res } = await api.get('/schedules/me/driver');
      return res;
    },
    enabled: user?.role === 'DRIVER',
  });

  const schedules = data?.data || [];
  const driverId = data?.driverId;

  useEffect(() => {
    if (user?.role !== 'DRIVER') return;
    const socket = io('/tracking', { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    return () => socket.disconnect();
  }, [user?.role]);

  const [lat, setLat] = useState('6.0333');
  const [lng, setLng] = useState('37.5543');

  const pushLocation = () => {
    const socket = socketRef.current;
    const vId = schedules[0]?.vehicle?.id;
    if (!socket || !vId) return toast.error('No vehicle on schedule');
    socket.emit('driver:location', {
      vehicleId: String(vId),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    });
    toast.success('Location pushed');
  };

  const statusMut = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data: res } = await api.patch(`/schedules/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-schedules'] });
      toast.success('Status updated');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  if (user?.role !== 'DRIVER') {
    return (
      <div className="card max-w-lg">
        <h1 className="page-title">Driver panel</h1>
        <p className="text-sm text-gray-600 mt-2">Sign in as a driver (e.g. driver1@semenconnect.et after seed) to manage trips and GPS updates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Bus className="w-6 h-6 text-primary" /> Driver operations
        </h1>
        <p className="page-subtitle">Schedules assigned to you • Driver ID: {driverId ? String(driverId).slice(-6) : '—'}</p>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold text-sidebar flex items-center gap-2">
          <Navigation className="w-4 h-4" /> Push GPS (Socket.IO)
        </h3>
        <div className="grid sm:grid-cols-2 gap-2">
          <input className="input" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" />
          <input className="input" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" />
        </div>
        <button type="button" className="btn-primary" onClick={pushLocation}>
          Broadcast location
        </button>
        <p className="text-xs text-gray-500">Uses first scheduled vehicle. Opens `/tracking` namespace.</p>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="grid gap-3">
        {schedules.map((s) => (
          <div key={s.id} className="card flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-sidebar flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {s.route?.name}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                {fmt(s.departureTime)} • {s.vehicle?.plateNumber}
              </p>
              <span className="badge-info text-[10px]">{s.status}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className="btn-secondary !py-1.5 !px-3 text-xs"
                  disabled={statusMut.isPending}
                  onClick={() => statusMut.mutate({ id: s.id, status: st })}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
