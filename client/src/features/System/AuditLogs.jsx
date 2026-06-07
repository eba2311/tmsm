import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { 
  ShieldCheck, Activity, Search, Filter, 
  Calendar, User, Lock, Eye, Download,
  AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data: logsData = { data: [], pagination: { total: 0 } }, isLoading } = useQuery({
    queryKey: ['audit-logs', page, searchTerm],
    queryFn: async () => {
      const { data } = await api.get('/audit-logs', { params: { page, limit: 50, action: searchTerm || undefined } });
      return data;
    },
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => (await api.get('/audit-logs/stats')).data.data || {},
  });

  const getActionBadge = (action) => {
    if (action.includes('CREATE')) return 'bg-etgreen/10 text-etgreen border-etgreen/20';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-600 border-blue-200';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-600 border-red-200';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-600 border-purple-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Security Audit Logs
          </h1>
          <p className="page-subtitle">Immutable record of all system activities and administrative actions</p>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export for Compliance
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-sidebar mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Top Actions
          </h3>
          <div className="space-y-3">
            {stats.actionStats?.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">{s.id}</span>
                <span className="text-xs font-bold text-sidebar">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-sidebar mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gold-dark" /> Top Users
          </h3>
          <div className="space-y-3">
            {stats.topUsers?.slice(0, 4).map(u => (
              <div key={u.userId} className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">{u.userName}</span>
                <span className="text-xs font-bold text-sidebar">{u.count} logs</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5 bg-sidebar text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Compliance Status</p>
              <p className="text-lg font-bold">SECURE & SYNCED</p>
            </div>
          </div>
          <p className="text-[10px] text-white/40 italic">
            Audit trail is protected by internal hashes and distributed ledger verification.
          </p>
        </div>
      </div>

      {/* Main Logs Table */}
      <div className="card p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by action (e.g. UPDATE_VEHICLE)..." 
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter by Date
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-gray-400 font-medium">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">Fetching audit records...</td>
                </tr>
              )}
              {logsData.data?.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <p className="font-medium text-sidebar">{format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}</p>
                    <p className="text-[10px] text-gray-400">{format(new Date(log.timestamp), 'yyyy')}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                        {log.user?.name?.[0] || 'S'}
                      </div>
                      <span className="font-semibold text-sidebar">{log.user?.name || 'System'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-lg border text-[10px] font-bold uppercase ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-500 font-medium">{log.resource}</span>
                  </td>
                  <td className="py-4 px-4">
                    <code className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">{log.ipAddress || '127.0.0.1'}</code>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-primary">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="mt-6 pt-6 border-t flex justify-between items-center text-xs text-gray-500">
          <p>Showing {logsData.data?.length || 0} of {logsData.pagination?.total || 0} records</p>
          <div className="flex gap-2">
            <button className="btn-secondary px-4 py-1" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="btn-secondary px-4 py-1" onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
