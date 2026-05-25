import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { 
  CreditCard, DollarSign, Calendar, User, 
  CheckCircle, AlertCircle, Clock, Filter, 
  Plus, Download, ExternalLink, TrendingUp,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

const safeFormat = (date, fmt) => {
  const d = new Date(date);
  return isValid(d) ? format(d, fmt) : 'N/A';
};

export default function DriverPayroll() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPayroll, setNewPayroll] = useState({
    driver: '',
    periodStart: '',
    periodEnd: '',
    baseSalary: 3000,
    tripsCompleted: 0,
    revenueGenerated: 0,
    commissionRate: 15,
  });
  const qc = useQueryClient();

  const { data: payrollRecords = [], isLoading } = useQuery({
    queryKey: ['driver-payroll', filterStatus],
    queryFn: async () => {
      const { data } = await api.get('/driver-payroll', { params: { status: filterStatus === 'all' ? undefined : filterStatus } });
      return data.data || [];
    },
  });

  const { data: summary = {} } = useQuery({
    queryKey: ['payroll-summary'],
    queryFn: async () => (await api.get('/driver-payroll/summary/overview')).data.data || {},
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-list'],
    queryFn: async () => (await api.get('/drivers')).data.data || [],
  });

  const createMut = useMutation({
    mutationFn: (payload) => api.post('/driver-payroll', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-payroll'] });
      qc.invalidateQueries({ queryKey: ['payroll-summary'] });
      toast.success('Payroll record created');
      setIsModalOpen(false);
      setNewPayroll({ driver: '', periodStart: '', periodEnd: '', baseSalary: 3000, tripsCompleted: 0, revenueGenerated: 0, commissionRate: 15 });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  });

  const approveMut = useMutation({
    mutationFn: (id) => api.patch(`/driver-payroll/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-payroll'] });
      qc.invalidateQueries({ queryKey: ['payroll-summary'] });
      toast.success('Payroll approved');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve payroll');
    }
  });

  const payMut = useMutation({
    mutationFn: (id) => api.patch(`/driver-payroll/${id}/pay`, { paymentMethod: 'BANK_TRANSFER' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-payroll'] });
      qc.invalidateQueries({ queryKey: ['payroll-summary'] });
      toast.success('Payment processed successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to process payment');
    }
  });

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Driver Payroll
          </h1>
          <p className="page-subtitle">Automated compensation management and expense tracking</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Payroll
          </button>
        </div>
      </div>

      {/* Create Payroll Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
              <h2 className="text-xl font-bold">Create Payroll Record</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                createMut.mutate({
                  driver: newPayroll.driver,
                  period: {
                    startDate: new Date(newPayroll.periodStart),
                    endDate: new Date(newPayroll.periodEnd),
                  },
                  baseSalary: Number(newPayroll.baseSalary),
                  tripsCompleted: Number(newPayroll.tripsCompleted),
                  revenueGenerated: Number(newPayroll.revenueGenerated),
                  commissionRate: Number(newPayroll.commissionRate),
                });
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Driver</label>
                <select 
                  className="input"
                  value={newPayroll.driver}
                  onChange={(e) => setNewPayroll({ ...newPayroll, driver: e.target.value })}
                  required
                >
                  <option value="">Select a driver...</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.user?.name} ({d.licenseNumber})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Period Start</label>
                  <input 
                    type="date"
                    className="input"
                    value={newPayroll.periodStart}
                    onChange={(e) => setNewPayroll({ ...newPayroll, periodStart: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Period End</label>
                  <input 
                    type="date"
                    className="input"
                    value={newPayroll.periodEnd}
                    onChange={(e) => setNewPayroll({ ...newPayroll, periodEnd: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Base Salary (ETB)</label>
                  <input 
                    type="number"
                    className="input"
                    value={newPayroll.baseSalary}
                    onChange={(e) => setNewPayroll({ ...newPayroll, baseSalary: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Trips Completed</label>
                  <input 
                    type="number"
                    className="input"
                    value={newPayroll.tripsCompleted}
                    onChange={(e) => setNewPayroll({ ...newPayroll, tripsCompleted: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Revenue Generated</label>
                  <input 
                    type="number"
                    className="input"
                    value={newPayroll.revenueGenerated}
                    onChange={(e) => setNewPayroll({ ...newPayroll, revenueGenerated: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Commission Rate (%)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className="input"
                    value={newPayroll.commissionRate}
                    onChange={(e) => setNewPayroll({ ...newPayroll, commissionRate: e.target.value })}
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
                  {createMut.isPending ? 'Saving...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Payroll (MTD)</p>
          <p className="text-2xl font-bold text-sidebar">{summary.totalPayroll?.toLocaleString()} <span className="text-sm font-normal">ETB</span></p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-etgreen font-bold">
            <TrendingUp className="w-3 h-3" /> 8.2% vs last month
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Active Drivers</p>
          <p className="text-2xl font-bold text-sidebar">{summary.totalDrivers || 0}</p>
          <p className="text-[10px] text-gray-400 mt-2">On current cycle</p>
        </div>
        <div className="card p-4 text-etgreen">
          <p className="text-xs text-gray-500 font-medium mb-1">Paid Records</p>
          <p className="text-2xl font-bold">{summary.processedCount || 0}</p>
          <p className="text-[10px] opacity-70 mt-2">Success transactions</p>
        </div>
        <div className="card p-4 text-gold-dark">
          <p className="text-xs text-gray-500 font-medium mb-1">Pending Approval</p>
          <p className="text-2xl font-bold">{summary.pendingCount || 0}</p>
          <p className="text-[10px] opacity-70 mt-2">Requires attention</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {['all', 'PENDING', 'PROCESSED', 'PAID'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                ${filterStatus === s ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-sidebar'}`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-600">Current Cycle: May 1 - May 15</span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-4 px-6">Driver</th>
                <th className="py-4 px-6">Period</th>
                <th className="py-4 px-6">Trips/Revenue</th>
                <th className="py-4 px-6">Gross Pay</th>
                <th className="py-4 px-6">Net Pay</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">Loading payroll records...</td>
                </tr>
              )}
              {payrollRecords.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No payroll records found for this period.</td>
                </tr>
              )}
              {payrollRecords.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {p.driver?.user?.name?.[0] || 'D'}
                      </div>
                      <div>
                        <p className="font-bold text-sidebar">{p.driver?.user?.name}</p>
                        <p className="text-[10px] text-gray-400">{p.driver?.licenseNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-xs font-medium text-gray-600">
                      {safeFormat(p.period.startDate, 'MMM dd')} - {safeFormat(p.period.endDate, 'MMM dd')}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-sidebar">{p.tripsCompleted} Trips</p>
                    <p className="text-[10px] text-etgreen font-bold">{p.revenueGenerated?.toLocaleString()} ETB Rev</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-xs text-gray-500 line-through">{p.grossPay?.toLocaleString()} ETB</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-primary text-base">{p.netPay?.toLocaleString()} ETB</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`badge-${p.status === 'PAID' ? 'success' : p.status === 'PROCESSED' ? 'info' : 'warning'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      {p.status === 'PENDING' && (
                        <button 
                          onClick={() => approveMut.mutate(p._id)}
                          disabled={approveMut.isPending}
                          className="p-2 bg-etgreen/10 text-etgreen rounded-lg hover:bg-etgreen hover:text-white transition-all"
                          title="Approve Payroll"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {p.status === 'PROCESSED' && (
                        <button 
                          onClick={() => payMut.mutate(p._id)}
                          disabled={payMut.isPending}
                          className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                          title="Process Payment"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-sidebar hover:text-white transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4">Payment Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50 opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="font-bold text-primary">CBE</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-sidebar">Commercial Bank of Ethiopia</p>
                  <p className="text-xs text-gray-500">Connected • Direct Deposit</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-etgreen" />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="font-bold text-primary">TB</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-sidebar">Telebirr Business</p>
                  <p className="text-xs text-gray-500">Active • Instant Settlement</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-etgreen" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4">Commission Policy</h3>
          <div className="bg-primary/5 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-gray-600">Standard driver commission is set at **15%** of net ticket revenue generated per trip.</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Performance Bonus (4.5+ Star)</span>
                <span className="font-bold text-etgreen">+2.5%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Night Shift Premium</span>
                <span className="font-bold text-primary">+1.0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
