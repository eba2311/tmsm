import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Bus, Plus, Search, Eye, Edit, Wrench, Fuel, LayoutGrid, List } from 'lucide-react';

const statusColors = { ACTIVE: 'badge-success', INACTIVE: 'badge-gray', MAINTENANCE: 'badge-warning', RETIRED: 'badge-danger' };
const typeIcons = { BUS: '🚌', MINIBUS: '🚐', BAJAJ: '🛺', TAXI: '🚕', CARGO: '🚛' };

export default function Vehicles() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('table'); // table | grid
  const [showModal, setShowModal] = useState(false);
  const [maintenanceVehicleId, setMaintenanceVehicleId] = useState(null);
  const [maintForm, setMaintForm] = useState({
    type: 'ROUTINE',
    description: '',
    cost: 0,
    mileageAtService: 0,
    startDate: new Date().toISOString().slice(0, 10),
    garage: 'Arba Minch Workshop',
    status: 'SCHEDULED',
  });
  const [form, setForm] = useState({
    plateNumber: '',
    type: 'BUS',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: 45,
    color: '',
    fuelType: 'DIESEL',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', page, search, filterType],
    queryFn: async () => {
      const { data: res } = await api.get('/vehicles', {
        params: { page, limit: 20, search: search || undefined, type: filterType || undefined },
      });
      return res;
    },
  });

  const vehicles = data?.data || [];
  const pagination = data?.pagination;

  const createMut = useMutation({
    mutationFn: () => api.post('/vehicles', form),
    onSuccess: () => {
      toast.success('Vehicle saved');
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      setShowModal(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const { data: maintLogs = [] } = useQuery({
    queryKey: ['vehicle-maintenance', maintenanceVehicleId],
    queryFn: async () => {
      const { data } = await api.get(`/vehicles/${maintenanceVehicleId}/maintenance`);
      return data.data || [];
    },
    enabled: !!maintenanceVehicleId,
  });

  const maintMut = useMutation({
    mutationFn: () =>
      api.post(`/vehicles/${maintenanceVehicleId}/maintenance`, {
        ...maintForm,
        cost: Number(maintForm.cost) || 0,
        mileageAtService: Number(maintForm.mileageAtService) || 0,
        startDate: new Date(maintForm.startDate),
      }),
    onSuccess: () => {
      toast.success('Maintenance logged');
      qc.invalidateQueries({ queryKey: ['vehicle-maintenance', maintenanceVehicleId] });
      setMaintForm((f) => ({ ...f, description: '', cost: 0 }));
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const stats = useMemo(() => {
    const counts = { BUS: 0, MINIBUS: 0, BAJAJ: 0, TAXI: 0, CARGO: 0 };
    vehicles.forEach((v) => {
      if (counts[v.type] != null) counts[v.type] += 1;
    });
    return counts;
  }, [vehicles]);

  return (
    <div className="space-y-5">
      <div className="section-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Vehicle Fleet</h1>
          <p className="page-subtitle">Mongo-backed fleet — grid/table toggle</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              className={`p-2 ${view === 'table' ? 'bg-primary text-white' : 'bg-white text-gray-500'}`}
              onClick={() => setView('table')}
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={`p-2 ${view === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-500'}`}
              onClick={() => setView('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button type="button" onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search plate number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
          />
        </div>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="input w-full sm:w-44">
          <option value="">All Types</option>
          <option value="BUS">Bus</option>
          <option value="MINIBUS">Minibus</option>
          <option value="BAJAJ">Bajaj</option>
          <option value="TAXI">Taxi</option>
          <option value="CARGO">Cargo</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(stats).map(([t, count]) => (
          <button
            key={t}
            type="button"
            className="card !p-3 flex items-center gap-3 text-left hover:ring-2 ring-primary/20"
            onClick={() => setFilterType(filterType === t ? '' : t)}
          >
              <span className="text-2xl">{typeIcons[t]}</span>
              <div>
                <p className="text-lg font-bold text-sidebar">{count}</p>
                <p className="text-[11px] text-gray-500">{t}</p>
              </div>
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading fleet…</p>}

      {view === 'table' && (
      <div className="card !p-0">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Year</th>
                <th>Capacity</th>
                <th>Mileage</th>
                <th>Fuel</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
                {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg">{typeIcons[v.type]}</div>
                      <div>
                        <p className="font-semibold text-sidebar">{v.plateNumber}</p>
                          <p className="text-xs text-gray-400">
                            {v.make} {v.model}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-info">{v.type}</span>
                  </td>
                  <td>{v.year}</td>
                  <td>{v.capacity} seats</td>
                    <td>{(v.mileage || 0).toLocaleString()} km</td>
                    <td className="flex items-center gap-1 text-xs">
                      <Fuel className="w-3 h-3" />
                      {v.fuelType}
                    </td>
                    <td>
                      <span className={statusColors[v.status]}>{v.status}</span>
                    </td>
                  <td>
                    <div className="flex items-center gap-1">
                        <button type="button" className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" aria-label="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button type="button" className="p-1.5 rounded-lg hover:bg-gold/10 text-gold-dark" aria-label="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg hover:bg-etgreen/10 text-etgreen"
                          aria-label="Maintenance"
                          onClick={() => setMaintenanceVehicleId(v.id)}
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {view === 'grid' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="card space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-3xl">{typeIcons[v.type]}</span>
                <span className={statusColors[v.status]}>{v.status}</span>
              </div>
              <p className="font-bold text-sidebar">{v.plateNumber}</p>
              <p className="text-xs text-gray-500">
                {v.make} {v.model} • {v.year}
              </p>
              <p className="text-sm">
                {v.capacity} seats • {(v.mileage || 0).toLocaleString()} km
              </p>
              <button type="button" className="btn-secondary !py-1.5 text-xs w-full mt-2" onClick={() => setMaintenanceVehicleId(v.id)}>
                Maintenance log
              </button>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button type="button" className="btn-secondary !py-1 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <span className="text-sm text-gray-600 py-1">
            Page {page} / {pagination.pages}
          </span>
          <button
            type="button"
            className="btn-secondary !py-1 text-xs"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <h2 className="text-lg font-bold text-sidebar mb-4">Add New Vehicle</h2>
            <div className="space-y-3">
              <input
                className="input"
                placeholder="Plate (AM-3-12345)"
                value={form.plateNumber}
                onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
              />
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="BUS">BUS</option>
                <option value="MINIBUS">MINIBUS</option>
                <option value="BAJAJ">BAJAJ</option>
                <option value="TAXI">TAXI</option>
                <option value="CARGO">CARGO</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
                <input className="input" placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  className="input"
                  placeholder="Year"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Capacity"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                />
              </div>
              <input className="input" placeholder="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              <select className="input" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
                <option value="DIESEL">DIESEL</option>
                <option value="PETROL">PETROL</option>
                <option value="ELECTRIC">ELECTRIC</option>
                <option value="HYBRID">HYBRID</option>
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary flex-1" disabled={createMut.isPending} onClick={() => createMut.mutate()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {maintenanceVehicleId && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setMaintenanceVehicleId(null)}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <h2 className="text-lg font-bold text-sidebar mb-2">Maintenance</h2>
            <p className="text-xs text-gray-500 mb-4">Vehicle ID: {String(maintenanceVehicleId).slice(-8)}</p>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-4 border border-gray-100 rounded-xl p-2">
              {maintLogs.length === 0 && <p className="text-xs text-gray-500">No logs yet.</p>}
              {maintLogs.map((log) => (
                <div key={log.id} className="text-xs border-b border-gray-50 pb-2">
                  <span className="font-semibold">{log.type}</span> — {log.description}{' '}
                  <span className="text-gold-dark">{log.cost} ETB</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <select className="input" value={maintForm.type} onChange={(e) => setMaintForm({ ...maintForm, type: e.target.value })}>
                <option value="ROUTINE">ROUTINE</option>
                <option value="REPAIR">REPAIR</option>
                <option value="INSPECTION">INSPECTION</option>
                <option value="EMERGENCY">EMERGENCY</option>
                <option value="UPGRADE">UPGRADE</option>
              </select>
              <textarea
                className="input min-h-[72px]"
                placeholder="Description"
                value={maintForm.description}
                onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="input"
                  placeholder="Cost ETB"
                  value={maintForm.cost}
                  onChange={(e) => setMaintForm({ ...maintForm, cost: e.target.value })}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Mileage"
                  value={maintForm.mileageAtService}
                  onChange={(e) => setMaintForm({ ...maintForm, mileageAtService: e.target.value })}
                />
              </div>
              <input type="date" className="input" value={maintForm.startDate} onChange={(e) => setMaintForm({ ...maintForm, startDate: e.target.value })} />
              <input className="input" placeholder="Garage" value={maintForm.garage} onChange={(e) => setMaintForm({ ...maintForm, garage: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" className="btn-secondary flex-1" onClick={() => setMaintenanceVehicleId(null)}>
                Close
              </button>
              <button type="button" className="btn-primary flex-1" disabled={maintMut.isPending || !maintForm.description} onClick={() => maintMut.mutate()}>
                Add log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
