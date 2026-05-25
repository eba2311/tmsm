import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { 
  Package, Boxes, Plus, Search, Filter, 
  TrendingUp, AlertCircle, ShoppingCart, 
  CheckCircle, History, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'PHYSICAL_TICKET',
    quantity: 0,
    price: 0,
    route: '',
    description: '',
  });
  const qc = useQueryClient();

  const { data: inventoryData = [], isLoading } = useQuery({
    queryKey: ['inventory', filterType],
    queryFn: async () => {
      const { data } = await api.get('/inventory', { params: { type: filterType === 'all' ? undefined : filterType } });
      return data.data || [];
    },
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => (await api.get('/inventory/stats')).data.data || {},
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data.data || [],
  });

  const addMut = useMutation({
    mutationFn: (data) => api.post('/inventory', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Item added to inventory');
      setIsModalOpen(false);
      setNewItem({ type: 'PHYSICAL_TICKET', quantity: 0, price: 0, route: '', description: '' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add item');
    },
  });

  const sellMut = useMutation({
    mutationFn: ({ id, quantity }) => api.post(`/inventory/${id}/sell`, { quantity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Inventory updated');
    },
  });

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Inventory & Asset Management
          </h1>
          <p className="page-subtitle">Track tickets, passes, and operational assets across the fleet</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-sidebar text-white">
              <h2 className="text-xl font-bold">Add New Item</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                addMut.mutate(newItem);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Item Type</label>
                <select 
                  className="input"
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                >
                  <option value="PHYSICAL_TICKET">Physical Ticket</option>
                  <option value="DIGITAL_TICKET">Digital Ticket</option>
                  <option value="MONTHLY_PASS">Monthly Pass</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Route (Optional)</label>
                <select 
                  className="input"
                  value={newItem.route}
                  onChange={(e) => setNewItem({ ...newItem, route: e.target.value })}
                >
                  <option value="">General / None</option>
                  {routes.map(r => (
                    <option key={r._id} value={r._id}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description / Information</label>
                <textarea 
                  className="input min-h-[80px] py-3"
                  placeholder="Additional details about this batch..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantity</label>
                  <input 
                    type="number"
                    className="input"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Unit Price (ETB)</label>
                  <input 
                    type="number"
                    className="input"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) })}
                    min="0"
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
                  disabled={addMut.isPending}
                  className="flex-1 btn-primary"
                >
                  {addMut.isPending ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Available Items</p>
          <p className="text-2xl font-bold text-sidebar">{stats.totalAvailable || 0}</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-etgreen font-bold">
            <ArrowUpRight className="w-3 h-3" /> Healthy Stock
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Items Sold</p>
          <p className="text-2xl font-bold text-sidebar">{stats.totalSold || 0}</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-primary font-bold">
            <TrendingUp className="w-3 h-3" /> High Velocity
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Reserved/On-Hold</p>
          <p className="text-2xl font-bold text-sidebar">{stats.totalReserved || 0}</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-gold-dark font-bold">
            <AlertCircle className="w-3 h-3" /> Requires Action
          </div>
        </div>
        <div className="card p-4 bg-primary text-white">
          <p className="text-xs text-white/60 font-medium mb-1">Inventory Value</p>
          <p className="text-2xl font-bold">{(stats.totalRevenue || 0).toLocaleString()} <span className="text-sm font-normal">ETB</span></p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-white/50 font-bold">
            <CheckCircle className="w-3 h-3" /> Audit Verified
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search assets or routes..." 
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {['all', 'PHYSICAL_TICKET', 'DIGITAL_TICKET', 'MONTHLY_PASS'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                ${filterType === t ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-sidebar'}`}
            >
              {t.replace('_', ' ').toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {inventoryData.map((item) => (
          <div key={item._id} className="card p-0 overflow-hidden group">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase
                  ${item.type === 'PHYSICAL_TICKET' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                  {item.type.replace('_', ' ')}
                </span>
                <span className={`text-xs font-bold ${item.status === 'AVAILABLE' ? 'text-etgreen' : 'text-red-500'}`}>
                  {item.status}
                </span>
              </div>
              <h3 className="font-bold text-sidebar text-lg mb-1">{item.route?.name || 'General Inventory'}</h3>
              {item.description && (
                <p className="text-xs text-gray-400 mb-3 italic">"{item.description}"</p>
              )}
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                <Boxes className="w-3 h-3" /> Current Stock: <span className="font-bold text-sidebar">{item.quantity} units</span>
              </p>
              
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Unit Price</p>
                  <p className="text-xl font-black text-primary">{item.price} <span className="text-xs font-medium">ETB</span></p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => sellMut.mutate({ id: item._id, quantity: 1 })}
                    disabled={item.quantity === 0 || sellMut.isPending}
                    className="p-2.5 bg-sidebar text-white rounded-xl hover:bg-primary transition-colors disabled:opacity-50"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 bg-gray-100 text-sidebar rounded-xl hover:bg-gray-200 transition-colors">
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="px-5 py-3 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-etgreen" />
                <span className="text-[10px] font-medium text-gray-500">Last updated today</span>
              </div>
              <button className="text-[10px] font-bold text-primary hover:underline">VIEW LOGS</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
