import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { useAuthStore } from '../../hooks/useAuthStore';
import toast from 'react-hot-toast';
import { MapPin, Search, ArrowRight, Plus } from 'lucide-react';

const point = (lng, lat) => ({ type: 'Point', coordinates: [lng, lat] });

export default function Routes_() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const canCreate = ['SUPER_ADMIN', 'OPERATOR'].includes(user?.role);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    distance: 100,
    estimatedDuration: 120,
    baseFare: 150,
    isIntercity: true,
  });

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data } = await api.get('/routes', { params: { status: 'ACTIVE' } });
      return data.data || [];
    },
  });

  const createMut = useMutation({
    mutationFn: () =>
      api.post('/routes', {
        name: form.name,
        code: form.code.toUpperCase().replace(/\s+/g, ''),
        distance: Number(form.distance),
        estimatedDuration: Number(form.estimatedDuration),
        baseFare: Number(form.baseFare),
        isIntercity: form.isIntercity,
        origin: { name: 'Arba Minch', coordinates: point(37.5543, 6.0333) },
        destination: { name: 'Destination', coordinates: point(38.75, 8.5) },
        transportType: ['BUS'],
        status: 'ACTIVE',
      }),
    onSuccess: () => {
      toast.success('Route created');
      qc.invalidateQueries({ queryKey: ['routes'] });
      setShowModal(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const filtered = useMemo(() => {
    return routes.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.name.toLowerCase().includes(q) || (r.code || '').toLowerCase().includes(q);
      const matchFilter = !filter || (filter === 'INTERCITY' ? r.isIntercity : !r.isIntercity);
      return matchSearch && matchFilter;
    });
  }, [routes, search, filter]);

  return (
    <div className="space-y-5">
      <div className="section-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Routes</h1>
          <p className="page-subtitle">Corridors from Arba Minch — መስመሮች</p>
        </div>
        {canCreate && (
          <button type="button" className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Add route
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search routes..." className="input pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-full sm:w-44">
          <option value="">All Routes</option>
          <option value="INTERCITY">Intercity</option>
          <option value="CITY">City Routes</option>
        </select>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <div key={r.id} className="card space-y-3 animate-fade-in">
            <div className="flex items-start justify-between">
              <span className="badge-info text-[10px]">{r.code}</span>
              <span className={r.isIntercity ? 'badge-success' : 'badge-warning'}>{r.isIntercity ? 'Intercity' : 'City'}</span>
            </div>
            <h3 className="font-semibold text-sidebar flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              {r.name}
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center bg-surface rounded-xl p-2.5">
              <div>
                <p className="text-xs text-gray-400">Distance</p>
                <p className="font-bold text-sm text-sidebar">{r.distance} km</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Duration</p>
                <p className="font-bold text-sm text-sidebar">
                  {Math.floor(r.estimatedDuration / 60)}h {r.estimatedDuration % 60}m
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Fare</p>
                <p className="font-bold text-sm text-gold-dark">{r.baseFare} ETB</p>
              </div>
            </div>
            {Array.isArray(r.stops) && r.stops.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {r.stops.map((s, i) => (
                  <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {s.name}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-1 flex-wrap">
              {(r.transportType || []).map((t) => (
                <span key={t} className="badge-gray text-[10px]">
                  {t}
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-50">
              <button type="button" className="btn-primary flex-1 !py-1.5 text-xs">
                <ArrowRight className="w-3 h-3 inline mr-1" />
                Schedules
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && canCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)} role="presentation">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
            <h2 className="text-lg font-bold text-sidebar">New route</h2>
            <p className="text-xs text-gray-500">Origin defaults to Arba Minch; edit later via API if needed.</p>
            <input className="input" placeholder="Display name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="Code e.g. AM-XX" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" className="input" placeholder="km" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} />
              <input
                type="number"
                className="input"
                placeholder="Min"
                value={form.estimatedDuration}
                onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
              />
              <input type="number" className="input" placeholder="ETB" value={form.baseFare} onChange={(e) => setForm({ ...form, baseFare: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.isIntercity} onChange={(e) => setForm({ ...form, isIntercity: e.target.checked })} />
              Intercity route
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary flex-1" disabled={createMut.isPending || !form.name || !form.code} onClick={() => createMut.mutate()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
