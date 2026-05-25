import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { useAuthStore } from '../../hooks/useAuthStore';
import toast from 'react-hot-toast';
import { MapPin, Clock, Bus, Users, Plus } from 'lucide-react';

const statusColors = {
  SCHEDULED: 'badge-info',
  BOARDING: 'badge-warning',
  DEPARTED: 'badge-gray',
  IN_TRANSIT: 'badge-info',
  ARRIVED: 'badge-success',
  CANCELLED: 'badge-danger',
  DELAYED: 'badge-danger',
};

const STATUSES = ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED', 'DELAYED'];

function driverLabel(d) {
  if (!d) return '—';
  return d.user?.name || d.licenseNumber || 'Driver';
}

export default function Schedules() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const canManage = ['SUPER_ADMIN', 'OPERATOR'].includes(user?.role);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    route: '',
    vehicle: '',
    driver: '',
    departureTime: '',
    estimatedArrival: '',
    totalSeats: 45,
    availableSeats: 45,
    fare: 200,
    platform: 'P1',
    status: 'SCHEDULED',
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules-admin'],
    queryFn: async () => {
      const { data } = await api.get('/schedules', { params: { limit: 80 } });
      return data.data || [];
    },
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-dd'],
    queryFn: async () => (await api.get('/routes', { params: { status: 'ACTIVE' } })).data.data || [],
    enabled: showCreate && canManage,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-dd'],
    queryFn: async () => (await api.get('/vehicles', { params: { limit: 100, status: 'ACTIVE' } })).data.data || [],
    enabled: showCreate && canManage,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-dd'],
    queryFn: async () => (await api.get('/drivers', { params: { limit: 100, status: 'ACTIVE' } })).data.data || [],
    enabled: showCreate && canManage,
  });

  const createMut = useMutation({
    mutationFn: () =>
      api.post('/schedules', {
        route: form.route,
        vehicle: form.vehicle,
        driver: form.driver,
        departureTime: new Date(form.departureTime).toISOString(),
        estimatedArrival: new Date(form.estimatedArrival).toISOString(),
        totalSeats: Number(form.totalSeats),
        availableSeats: Number(form.availableSeats),
        fare: Number(form.fare),
        platform: form.platform,
        status: form.status,
      }),
    onSuccess: () => {
      toast.success('Schedule created');
      qc.invalidateQueries({ queryKey: ['schedules-admin'] });
      setShowCreate(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/schedules/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules-admin'] });
      toast.success('Status updated');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  const filtered = useMemo(
    () =>
      schedules.filter((s) => {
        const q = search.toLowerCase();
        const routeName = (s.route?.name || '').toLowerCase();
        const plate = (s.vehicle?.plateNumber || '').toLowerCase();
        return !q || routeName.includes(q) || plate.includes(q);
      }),
    [schedules, search]
  );

  return (
    <div className="space-y-5">
      <div className="section-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Schedules</h1>
          <p className="page-subtitle">Create departures, change status — መርሐ ግብር</p>
        </div>
        {canManage && (
          <button type="button" className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New schedule
          </button>
        )}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search route or vehicle..."
        className="input max-w-md"
      />

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="card !p-0">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Departure</th>
                <th>Seats</th>
                <th>Fare</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id}>
                  <td className="font-medium flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {s.route?.name}
                  </td>
                  <td>
                    <span className="flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-gray-400" />
                      {s.vehicle?.plateNumber}
                    </span>
                  </td>
                  <td>{driverLabel(s.driver)}</td>
                  <td>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(s.departureTime).toLocaleString('en-GB', { timeZone: 'Africa/Addis_Ababa' })}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className={s.availableSeats === 0 ? 'text-etred font-bold' : ''}>
                        {s.availableSeats}/{s.totalSeats}
                      </span>
                    </div>
                  </td>
                  <td className="font-semibold text-gold-dark">{s.fare} ETB</td>
                  <td>
                    <span className={statusColors[s.status] || 'badge-gray'}>{s.status}</span>
                  </td>
                  {canManage && (
                    <td>
                      <select
                        className="input !py-1.5 text-xs min-w-[140px]"
                        value={s.status}
                        onChange={(e) => statusMut.mutate({ id: s._id, status: e.target.value })}
                        disabled={statusMut.isPending}
                        aria-label="Change schedule status"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && canManage && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)} role="presentation">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3 animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <h2 className="text-lg font-bold text-sidebar">New schedule</h2>
            <select className="input" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })}>
              <option value="">Select route</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select className="input" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.plateNumber} — {v.type}
                </option>
              ))}
            </select>
            <select className="input" value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })}>
              <option value="">Select driver</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {driverLabel(d)} — {d.licenseNumber}
                </option>
              ))}
            </select>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Departure</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.departureTime}
                  onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Est. arrival</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.estimatedArrival}
                  onChange={(e) => setForm({ ...form, estimatedArrival: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                className="input"
                placeholder="Total seats"
                value={form.totalSeats}
                onChange={(e) => setForm({ ...form, totalSeats: e.target.value, availableSeats: e.target.value })}
              />
              <input
                type="number"
                className="input"
                placeholder="Available"
                value={form.availableSeats}
                onChange={(e) => setForm({ ...form, availableSeats: e.target.value })}
              />
              <input type="number" className="input" placeholder="Fare ETB" value={form.fare} onChange={(e) => setForm({ ...form, fare: e.target.value })} />
            </div>
            <input className="input" placeholder="Platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
            <div className="flex gap-2 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={createMut.isPending || !form.route || !form.vehicle || !form.driver || !form.departureTime || !form.estimatedArrival}
                onClick={() => createMut.mutate()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
