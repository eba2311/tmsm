import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { useAuthStore } from '../../hooks/useAuthStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, FileText, TrendingUp, Ticket, Bus, MapPin } from 'lucide-react';

const COLORS = ['#1B4F8A', '#C9920A', '#2D7D3A', '#B5251A', '#8B5E3C'];

function revenueLabel(row) {
  const id = row._id;
  if (!id) return '—';
  if (id.day != null) return `${id.year}-${String(id.month).padStart(2, '0')}-${String(id.day).padStart(2, '0')}`;
  if (id.week != null) return `Y${id.year} W${id.week}`;
  if (id.month != null) return `${id.year}-${String(id.month).padStart(2, '0')}`;
  return JSON.stringify(id);
}

export default function Reports() {
  const { user } = useAuthStore();
  const allowed = ['SUPER_ADMIN', 'OPERATOR', 'AGENT'].includes(user?.role);

  const { data: overview } = useQuery({
    queryKey: ['reports-overview'],
    queryFn: async () => (await api.get('/reports/overview')).data.data,
    enabled: allowed,
  });

  const { data: revenueRaw = [] } = useQuery({
    queryKey: ['reports-revenue'],
    queryFn: async () => (await api.get('/reports/revenue', { params: { days: 60, period: 'daily' } })).data.data || [],
    enabled: allowed,
  });

  const { data: bookingStats = [] } = useQuery({
    queryKey: ['reports-bookings'],
    queryFn: async () => (await api.get('/reports/bookings')).data.data || [],
    enabled: allowed,
  });

  const { data: topRoutes = [] } = useQuery({
    queryKey: ['reports-routes'],
    queryFn: async () => (await api.get('/reports/routes')).data.data || [],
    enabled: allowed,
  });

  const { data: paySummary = [] } = useQuery({
    queryKey: ['payments-summary'],
    queryFn: async () => (await api.get('/payments/summary')).data.data || [],
    enabled: allowed && ['SUPER_ADMIN', 'OPERATOR'].includes(user?.role),
  });

  const revenueChart = useMemo(
    () =>
      revenueRaw.map((r) => ({
        label: revenueLabel(r),
        revenue: r.revenue || 0,
        count: r.count || 0,
      })),
    [revenueRaw]
  );

  const pieData = useMemo(
    () =>
      bookingStats.map((b) => ({
        name: b._id || 'UNKNOWN',
        value: b.count || 0,
      })),
    [bookingStats]
  );

  const exportCsv = () => {
    if (!allowed) return;
    const lines = [['Metric', 'Value'], ['Total bookings', overview?.totalBookings ?? ''], ['Revenue ETB', overview?.totalRevenue ?? '']];
    topRoutes.forEach((r) => lines.push([r.routeName, String(r.revenue)]));
    const blob = new Blob([lines.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amtms-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!allowed) {
    return (
      <div className="card max-w-lg">
        <h1 className="page-title">Reports</h1>
        <p className="text-sm text-gray-600 mt-2">Your role cannot access analytics. Sign in as Admin, Operator, or Agent.</p>
      </div>
    );
  }

  const util = overview?.totalVehicles ? Math.min(100, Math.round(((overview.activeSchedules || 0) / (overview.totalVehicles * 3)) * 100)) : 0;

  return (
    <div className="space-y-5">
      <div className="section-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Live aggregates from PostgreSQL — ሪፖርቶች</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/v1/docs/openapi.json" target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-2 text-xs">
            <FileText className="w-4 h-4" /> OpenAPI
          </a>
          <button type="button" className="btn-secondary flex items-center gap-2" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue (ETB)', labelAm: 'ጠቅላላ ገቢ (ብር)', value: Number(overview?.totalRevenue || 0).toLocaleString(), icon: TrendingUp, color: 'bg-gold/10 text-gold-dark' },
          { label: 'Total Bookings', labelAm: 'ጠቅላላ ቦታ ማስያዣ', value: String(overview?.totalBookings ?? 0), icon: Ticket, color: 'bg-primary/10 text-primary' },
          { label: 'Fleet utilization (proxy)', labelAm: 'የተሽከርካሪ አጠቃቀም', value: `${util}%`, icon: Bus, color: 'bg-etgreen/10 text-etgreen' },
          { label: 'Active schedules', labelAm: 'ንቁ መርሐ ግብሮች', value: String(overview?.activeSchedules ?? 0), icon: MapPin, color: 'bg-etred/10 text-etred' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label} <span className="text-[10px] opacity-60 ml-1">({s.labelAm})</span></p>
              <p className="text-lg font-bold text-sidebar">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-sidebar mb-4">Paid revenue by day (ETB)</h3>
          {revenueChart.length === 0 ? (
            <p className="text-sm text-gray-500 py-8">No successful payments in range — create bookings and pay.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `${Number(v).toLocaleString()} ETB`} />
                <Line type="monotone" dataKey="revenue" stroke="#C9920A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold text-sidebar mb-4">Booking status</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-500 py-8">No bookings yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {pieData.map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {s.name}: {s.value}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-sidebar mb-4">Top routes</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={topRoutes.length ? topRoutes : [{ routeName: '—', bookings: 0, revenue: 0 }]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="routeName" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="bookings" fill="#1B4F8A" radius={[6, 6, 0, 0]} name="Bookings" />
            <Bar dataKey="revenue" fill="#C9920A" radius={[6, 6, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {['SUPER_ADMIN', 'OPERATOR'].includes(user?.role) && (
        <div className="card">
          <h3 className="font-semibold text-sidebar mb-4">Payment mix (successful)</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Count</th>
                  <th>Total ETB</th>
                </tr>
              </thead>
              <tbody>
                {(paySummary.length ? paySummary : [{ _id: '—', count: 0, total: 0 }]).map((p, i) => (
                  <tr key={i}>
                    <td className="font-medium">{p._id}</td>
                    <td>{p.count}</td>
                    <td className="font-semibold">{Number(p.total || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
