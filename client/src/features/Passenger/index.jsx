import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { useAuthStore } from '../../hooks/useAuthStore';
import toast from 'react-hot-toast';
import { Users, Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Calendar, Filter, Download, BarChart3, Activity, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';

const statusColors = { ACTIVE: 'badge-success', INACTIVE: 'badge-gray', SUSPENDED: 'badge-danger', BLACKLISTED: 'badge-dark' };

export default function Passenger() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const canManage = ['SUPER_ADMIN', 'OPERATOR'].includes(user?.role);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // cards, table
  const [showModal, setShowModal] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [activeTab, setActiveTab] = useState('passengers'); // passengers, analytics, history
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    emergencyContact: '',
    emergencyPhone: '',
    status: 'ACTIVE',
  });

  const { data: passengers = [], isLoading } = useQuery({
    queryKey: ['passengers'],
    queryFn: async () => {
      const { data } = await api.get('/passengers', { params: { limit: 100 } });
      return data.data || [];
    },
  });

  const { data: passengerAnalytics = [] } = useQuery({
    queryKey: ['passenger-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/passengers/analytics');
      return data.data || [];
    },
    enabled: activeTab === 'analytics',
  });

  const { data: passengerHistory = [] } = useQuery({
    queryKey: ['passenger-history', selectedPassenger?.id],
    queryFn: async () => {
      const { data } = await api.get(`/passengers/${selectedPassenger?.id}/history`);
      return data.data || [];
    },
    enabled: !!selectedPassenger && activeTab === 'history',
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/passengers', form),
    onSuccess: () => {
      toast.success('Passenger created');
      qc.invalidateQueries({ queryKey: ['passengers'] });
      setShowModal(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: () => api.put(`/passengers/${selectedPassenger?.id}`, form),
    onSuccess: () => {
      toast.success('Passenger updated');
      qc.invalidateQueries({ queryKey: ['passengers'] });
      setShowModal(false);
      setSelectedPassenger(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/passengers/${id}`),
    onSuccess: () => {
      toast.success('Passenger deleted');
      qc.invalidateQueries({ queryKey: ['passengers'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const filtered = passengers.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.phone?.includes(q) || p.email?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSubmit = () => {
    if (selectedPassenger) {
      updateMut.mutate();
    } else {
      createMut.mutate();
    }
  };

  const handleEdit = (passenger) => {
    setSelectedPassenger(passenger);
    setForm({
      name: passenger.name || '',
      phone: passenger.phone || '',
      email: passenger.email || '',
      address: passenger.address || '',
      dateOfBirth: passenger.dateOfBirth || '',
      gender: passenger.gender || '',
      emergencyContact: passenger.emergencyContact || '',
      emergencyPhone: passenger.emergencyPhone || '',
      status: passenger.status || 'ACTIVE',
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this passenger?')) {
      deleteMut.mutate(id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="section-header">
        <div>
          <h1 className="page-title">Passenger Management</h1>
          <p className="page-subtitle">Comprehensive passenger profiles and history — ተሳታፍ</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <button onClick={() => { setShowModal(true); setSelectedPassenger(null); setForm({ name: '', phone: '', email: '', address: '', dateOfBirth: '', gender: '', emergencyContact: '', emergencyPhone: '', status: 'ACTIVE' }); }} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Passenger
            </button>
          )}
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'passengers', label: 'Passengers', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'history', label: 'History', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search passengers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-full sm:w-44">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BLACKLISTED">Blacklisted</option>
        </select>
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-semibold">Total Passengers</span>
              </div>
              <p className="text-2xl font-bold">{passengers.length}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-primary" />
                <span className="font-semibold">Active Today</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{passengers.filter(p => p.status === 'ACTIVE').length}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-semibold">New This Week</span>
              </div>
              <p className="text-2xl font-bold">12</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-semibold">Blacklisted</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{passengers.filter(p => p.status === 'BLACKLISTED').length}</p>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold mb-4">Passenger Analytics</h3>
            <div className="space-y-3">
              {passengerAnalytics.slice(0, 5).map((analytics) => (
                <div key={analytics.metricId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{analytics.name}</p>
                    <p className="text-xs text-gray-500">{analytics.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{analytics.value}</p>
                    <p className={`text-xs ${analytics.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.change}% vs last period
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && selectedPassenger && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Travel History - {selectedPassenger.name}</h3>
            <button className="btn-secondary text-sm">
              <Download className="w-4 h-4" />
              Export History
            </button>
          </div>
          <div className="space-y-3">
            {passengerHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No travel history found</p>
            ) : (
              passengerHistory.map((history) => (
                <div key={history.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{history.route?.name}</p>
                      <p className="text-xs text-gray-500">{history.date} • {history.vehicle?.plateNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{history.fare} ETB</p>
                    <span className={`badge-${history.status === 'COMPLETED' ? 'success' : 'warning'}`}>
                      {history.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'passengers' && (
        <>
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="card space-y-3 animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-300 flex items-center justify-center text-white font-bold text-lg">
                    {p.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-sidebar">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {p.phone}
                    </p>
                  </div>
                </div>
                <span className={statusColors[p.status] || 'badge-gray'}>{p.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Phone className="w-3.5 h-3.5" />
                  {p.phone}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Mail className="w-3.5 h-3.5" />
                  {p.email || '—'}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 col-span-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {p.address || '—'}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : '—'}
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Shield className="w-3.5 h-3.5" />
                  {p.totalTrips || 0} trips
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-50">
                <button onClick={() => { setSelectedPassenger(p); setActiveTab('history'); }} className="btn-secondary flex-1 !py-1.5 text-xs">
                  <Activity className="w-3 h-3 inline mr-1" />
                  History
                </button>
                {canManage && (
                  <>
                    <button onClick={() => handleEdit(p)} className="btn-secondary flex-1 !py-1.5 text-xs">
                      <Edit className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="btn-secondary flex-1 !py-1.5 text-xs text-red-600">
                      <Trash2 className="w-3 h-3 inline mr-1" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="card !p-0">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Total Trips</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.phone}</td>
                    <td>{p.email || '—'}</td>
                    <td>{p.address || '—'}</td>
                    <td>{p.totalTrips || 0}</td>
                    <td>
                      <span className={statusColors[p.status] || 'badge-gray'}>{p.status}</span>
                    </td>
                    {canManage && (
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-10 text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {showModal && canManage && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)} role="presentation">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
            <h2 className="text-lg font-bold text-sidebar">{selectedPassenger ? 'Edit Passenger' : 'Add New Passenger'}</h2>
            <input className="input" placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <input className="input" placeholder="Emergency Contact Name" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            <input className="input" placeholder="Emergency Contact Phone" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BLACKLISTED">Blacklisted</option>
            </select>
            <div className="flex gap-2 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => { setShowModal(false); setSelectedPassenger(null); }}>
                Cancel
              </button>
              <button type="button" className="btn-primary flex-1" disabled={!form.name || !form.phone} onClick={handleSubmit}>
                {selectedPassenger ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
