import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Search, Phone, Star, MapPin, CreditCard, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const statusMap = { ACTIVE: 'badge-success', ON_LEAVE: 'badge-warning', SUSPENDED: 'badge-danger', INACTIVE: 'badge-gray' };

export default function Drivers() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    licenseNumber: '',
    licenseClass: '3',
    salary: 8000,
  });
  const qc = useQueryClient();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data } = await api.get('/drivers', { params: { limit: 100 } });
      return data.data || [];
    },
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/drivers', newDriver),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver created successfully');
      setIsModalOpen(false);
      setNewDriver({ name: '', email: '', phone: '', password: '', licenseNumber: '', licenseClass: '3', salary: 8000 });
    },
    onError: (e) => {
      const msg = typeof e.response?.data === 'string' 
        ? e.response.data 
        : (e.response?.data?.message || 'Failed to create driver');
      toast.error(msg);
    }
  });

  const filtered = drivers.filter((d) => {
    const name = d.user?.name || '';
    const q = search.toLowerCase();
    return !q || name.toLowerCase().includes(q) || (d.licenseNumber || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="section-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Drivers</h1>
          <p className="page-subtitle">Driver profiles linked to users — ሹፌሮች</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
              <h2 className="text-xl font-bold">Add New Driver</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                createMut.mutate();
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
                <input 
                  type="text"
                  className="input"
                  placeholder="e.g. Abebe Kebede"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                  <input 
                    type="email"
                    className="input"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone</label>
                  <input 
                    type="text"
                    className="input"
                    placeholder="+251..."
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
                  <input 
                    type="password"
                    className="input"
                    value={newDriver.password}
                    onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">License Number</label>
                  <input 
                    type="text"
                    className="input"
                    value={newDriver.licenseNumber}
                    onChange={(e) => setNewDriver({ ...newDriver, licenseNumber: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">License Class</label>
                  <select 
                    className="input"
                    value={newDriver.licenseClass}
                    onChange={(e) => setNewDriver({ ...newDriver, licenseClass: e.target.value })}
                  >
                    <option value="1">Class 1 (Motorcycle)</option>
                    <option value="2">Class 2 (Automobile)</option>
                    <option value="3">Class 3 (Minibus/Taxi)</option>
                    <option value="4">Class 4 (Bus)</option>
                    <option value="5">Class 5 (Heavy Truck)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Base Salary (ETB)</label>
                  <input 
                    type="number"
                    className="input"
                    value={newDriver.salary}
                    onChange={(e) => setNewDriver({ ...newDriver, salary: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createMut.isPending}
                  className="flex-1 btn-primary"
                >
                  {createMut.isPending ? 'Saving...' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'INACTIVE'].map((st) => (
          <div key={st} className="card !p-4 text-center">
            <p className="text-2xl font-bold text-sidebar">{drivers.filter((d) => d.status === st).length}</p>
            <p className="text-xs text-gray-500 mt-1">{st.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search drivers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((d) => {
          const name = d.user?.name || 'Unknown Driver';
          const phone = d.user?.phone || '—';
          const assignedRoute = d.assignedRoute?.name || 'No route assigned';
          return (
            <div key={d.id} className="card space-y-3 animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-300 flex items-center justify-center text-white font-bold text-lg">
                    {name[0] || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-sidebar">{name}</p>
                    <p className="text-xs text-gray-400">
                      {d.licenseNumber} • Class {d.licenseClass}
                    </p>
                  </div>
                </div>
                <span className={statusMap[d.status] || 'badge-gray'}>{d.status.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Phone className="w-3.5 h-3.5" />
                  {phone}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Star className="w-3.5 h-3.5 text-gold" />
                  {d.rating || '5.0'}/5 ({d.totalTrips || 0} trips)
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 col-span-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {assignedRoute}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <CreditCard className="w-3.5 h-3.5" />
                  {Number(d.salary || 0).toLocaleString()} ETB/mo
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
