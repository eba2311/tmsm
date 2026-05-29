import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { formatEthiopian } from '../../utils/ethiopianCalendar';
import { format } from 'date-fns';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Bus, Users, Ticket, TrendingUp, MapPin } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#1B4F8A', '#C9920A', '#2D7D3A', '#B5251A', '#8B5E3C'];

const mockRevenue = [
  { name: 'Mon', revenue: 12400 },
  { name: 'Tue', revenue: 18200 },
  { name: 'Wed', revenue: 14800 },
  { name: 'Thu', revenue: 22100 },
  { name: 'Fri', revenue: 28400 },
  { name: 'Sat', revenue: 32100 },
  { name: 'Sun', revenue: 19700 },
];

export default function Dashboard() {
  const todayEt = formatEthiopian(new Date());
  const { user } = useAuthStore();
  const canReports = ['SUPER_ADMIN', 'OPERATOR', 'AGENT'].includes(user?.role);

  const { data: overview } = useQuery({
    queryKey: ['reports-overview'],
    queryFn: async () => (await api.get('/reports/overview')).data.data,
    enabled: canReports,
  });

  const { data: topRoutes = [] } = useQuery({
    queryKey: ['reports-routes'],
    queryFn: async () => (await api.get('/reports/routes')).data.data,
    enabled: canReports,
  });

  const { data: fleetAgg = [] } = useQuery({
    queryKey: ['reports-fleet'],
    queryFn: async () => (await api.get('/reports/fleet')).data.data,
    enabled: canReports,
  });

  const fleetPie = useMemo(() => buildFleetPieData(fleetAgg), [fleetAgg]);

  const stats = [
    {
      label: 'Total Vehicles',
      labelAm: 'ጠቅላላ ተሽከርካሪ',
      value: canReports ? String(overview?.totalVehicles ?? '—') : '—',
      change: canReports ? 'Live DB' : 'Reports role',
      icon: Bus,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Active Drivers',
      labelAm: 'ንቁ ሹፌሮች',
      value: canReports ? String(overview?.totalDrivers ?? '—') : '—',
      change: canReports ? 'Live DB' : '',
      icon: Users,
      color: 'bg-etgreen/10 text-etgreen',
    },
    {
      label: 'Total bookings',
      labelAm: 'ቦታ ማስያዣ',
      value: canReports ? String(overview?.totalBookings ?? '—') : '—',
      change: '',
      icon: Ticket,
      color: 'bg-gold/10 text-gold-dark',
    },
    {
      label: 'Revenue (ETB)',
      labelAm: 'ገቢ (ብር)',
      value: canReports ? Number(overview?.totalRevenue || 0).toLocaleString() : '—',
      change: canReports ? 'Paid tickets' : '',
      icon: TrendingUp,
      color: 'bg-etred/10 text-etred',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="page-title">እንኳን ደህና መጡ {user?.name?.split(' ')[0]}!</h1>
          <p className="page-subtitle flex items-center gap-2">
            {format(new Date(), 'EEEE, MMMM do')} • <span className="text-primary font-bold">{todayEt}</span>
          </p>
        </div>
      </div>

        {!canReports && !['DRIVER'].includes(user?.role) && (
        <div className="rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold-dark">
          Full KPIs and revenue charts require <strong>Operator</strong>, <strong>Super Admin</strong>, or <strong>Agent</strong>. You still have access to operational modules for your role.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`stat-icon ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-xl font-bold text-sidebar">{s.value}</p>
              {s.change && <span className="text-xs font-semibold text-etgreen">{s.change}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-sidebar mb-4">Weekly revenue sample (ETB)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mockRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B4F8A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1B4F8A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v.toLocaleString()} ETB`} />
              <Area type="monotone" dataKey="revenue" stroke="#1B4F8A" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-sidebar mb-4">Fleet by type (DB)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={fleetPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {fleetPie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {fleetPie.map((f, i) => (
              <span key={i} className="flex items-center gap-1 text-[11px] text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {f.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="section-header">
            <h3 className="font-semibold text-sidebar">Top routes — ዋና መስመሮች</h3>
            <span className="badge-info">
              <MapPin className="w-3 h-3" /> {canReports ? 'PostgreSQL query' : 'N/A'}
            </span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Bookings</th>
                  <th>Revenue (ETB)</th>
                </tr>
              </thead>
              <tbody>
                {(canReports ? topRoutes : []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-500 text-sm py-6">
                      No booking data yet.
                    </td>
                  </tr>
                )}
                {canReports &&
                  topRoutes.map((r) => (
                    <tr key={String(r.id)}>
                      <td className="font-medium">{r.routeName}</td>
                      <td>{r.bookings}</td>
                      <td className="font-semibold">{Number(r.revenue || 0).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-sidebar mb-4">System Health — የስርዓት ሁኔታ</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-etgreen">
                <span className="w-2 h-2 rounded-full bg-etgreen animate-pulse" /> ONLINE
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database (PostgreSQL)</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-etgreen">
                <span className="w-2 h-2 rounded-full bg-etgreen" /> CONNECTED
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Real-time (Socket.io)</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-etgreen">
                <span className="w-2 h-2 rounded-full bg-etgreen" /> SYNCED
              </span>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Server Load</span>
                <span>12%</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[12%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildFleetPieData(fleetAgg) {
  const map = {};
  (fleetAgg || []).forEach((row) => {
    const t = row.id?.type || 'UNKNOWN';
    map[t] = (map[t] || 0) + row.count;
  });
  const entries = Object.entries(map);
  if (!entries.length) {
    return [
      { name: 'Bus', value: 1 },
      { name: 'Minibus', value: 1 },
    ];
  }
  return entries.map(([name, value]) => ({ name, value }));
}
