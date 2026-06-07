import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { 
  CalendarClock, Mail, Settings, Plus,
  Search, Filter, CheckCircle, Clock,
  XCircle, Send, FileText, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportScheduler() {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    reportType: 'overview',
    schedule: {
      type: 'weekly',
      time: '08:00',
    },
    format: 'pdf',
    recipients: '',
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: async () => (await api.get('/report-schedules')).data.data || [],
  });

  const runMutation = useMutation({
    mutationFn: (id) => api.post(`/report-schedules/${id}/run`),
    onSuccess: () => {
      toast.success('Report generation triggered');
      qc.invalidateQueries({ queryKey: ['report-schedules'] });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/report-schedules', data),
    onSuccess: () => {
      toast.success('Report schedule created successfully');
      qc.invalidateQueries({ queryKey: ['report-schedules'] });
      setIsModalOpen(false);
      setNewSchedule({
        name: '', description: '', reportType: 'overview',
        schedule: { type: 'weekly', time: '08:00' },
        format: 'pdf', recipients: ''
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create schedule');
    }
  });

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-primary" />
            Automated Reporting
          </h1>
          <p className="page-subtitle">Schedule recurring reports delivered directly to your email</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Schedule
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
              <h2 className="text-xl font-bold">New Report Schedule</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  name: newSchedule.name,
                  description: newSchedule.description,
                  reportType: newSchedule.reportType,
                  scheduleType: newSchedule.schedule.type,
                  scheduleTime: newSchedule.schedule.time,
                  format: newSchedule.format,
                  recipients: newSchedule.recipients.split(',').map((email) => email.trim()).filter(Boolean),
                  filters: {},
                });
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Schedule Name</label>
                <input 
                  type="text"
                  className="input"
                  placeholder="e.g. Weekly Financial Summary"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Report Type</label>
                  <select 
                    className="input"
                    value={newSchedule.reportType}
                    onChange={(e) => setNewSchedule({ ...newSchedule, reportType: e.target.value })}
                  >
                    <option value="overview">Overview</option>
                    <option value="revenue">Revenue</option>
                    <option value="bookings">Bookings</option>
                    <option value="fleet">Fleet</option>
                    <option value="routes">Routes</option>
                    <option value="performance">Performance</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Format</label>
                  <select 
                    className="input"
                    value={newSchedule.format}
                    onChange={(e) => setNewSchedule({ ...newSchedule, format: e.target.value })}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV Data</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Frequency</label>
                  <select 
                    className="input"
                    value={newSchedule.schedule.type}
                    onChange={(e) => setNewSchedule({ ...newSchedule, schedule: { ...newSchedule.schedule, type: e.target.value } })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Time (HH:MM)</label>
                  <input 
                    type="time"
                    className="input"
                    value={newSchedule.schedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, schedule: { ...newSchedule.schedule, time: e.target.value } })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Recipients (Comma separated)</label>
                <input 
                  type="text"
                  className="input"
                  placeholder="admin@example.com, manager@example.com"
                  value={newSchedule.recipients}
                  onChange={(e) => setNewSchedule({ ...newSchedule, recipients: e.target.value })}
                  required
                />
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
                  disabled={createMutation.isPending}
                  className="flex-1 btn-primary"
                >
                  {createMutation.isPending ? 'Saving...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-20 text-gray-400">Scanning for scheduled tasks...</div>
        ) : schedules.length === 0 ? (
          <div className="col-span-full card p-20 text-center text-gray-400 border-dashed">
            <Mail className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-lg font-bold text-sidebar opacity-40 uppercase tracking-widest">No active schedules</p>
            <p className="max-w-xs mx-auto mt-2">Automate your workflow by scheduling daily, weekly, or monthly financial summaries.</p>
          </div>
        ) : (
          schedules.map((s) => (
            <div key={s._id} className="card p-0 overflow-hidden group">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase
                    ${s.active ? 'bg-etgreen/10 text-etgreen' : 'bg-gray-100 text-gray-400'}`}>
                    {s.active ? 'Active' : 'Paused'}
                  </span>
                  <div className="flex gap-1">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-sidebar"><Settings className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-sidebar mb-1 uppercase tracking-tight">{s.name || s.reportType.replace('_', ' ')}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-2 mb-6">
                  <Clock className="w-3 h-3" /> Every {(s.schedule?.type || 'week').toLowerCase()} at {s.schedule?.time || '00:00'}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recipients</p>
                      <p className="text-xs font-medium text-sidebar truncate">{s.recipients.join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Format</p>
                      <p className="text-xs font-medium text-sidebar">{s.format.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Last Run</p>
                  <p className="text-[11px] font-bold text-sidebar">{s.lastRun ? new Date(s.lastRun).toLocaleDateString() : 'Never'}</p>
                </div>
                <button 
                  onClick={() => runMutation.mutate(s._id)}
                  disabled={runMutation.isPending}
                  className="flex items-center gap-2 text-xs font-black text-primary hover:gap-3 transition-all"
                >
                  RUN NOW <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
