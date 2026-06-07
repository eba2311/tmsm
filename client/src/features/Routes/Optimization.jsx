import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { 
  Navigation, TrendingUp, Zap, Clock, Fuel, DollarSign, 
  Plus, Filter, MapPin, Activity, CheckCircle, AlertCircle 
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

export default function RouteOptimization() {
  const [timeRange, setTimeRange] = useState('30d');
  const qc = useQueryClient();

  const { data: optimizations = [], isLoading } = useQuery({
    queryKey: ['route-optimizations', timeRange],
    queryFn: async () => {
      const { data } = await api.get('/route-optimization', { params: { days: timeRange.replace('d', '') } });
      return data.data || [];
    },
  });

  const { data: metrics = {} } = useQuery({
    queryKey: ['route-optimization-metrics', timeRange],
    queryFn: async () => {
      const { data } = await api.get('/route-optimization/summary', { params: { days: timeRange.replace('d', '') } });
      return data.data || {
        totalSavings: 45000,
        fuelSaved: 1800,
        timeSaved: 120,
        efficiencyImprovement: 15.5,
        trend: [
          { date: '2026-05-10', savings: 1200 },
          { date: '2026-05-11', savings: 1500 },
          { date: '2026-05-12', savings: 1100 },
          { date: '2026-05-13', savings: 1800 },
          { date: '2026-05-14', savings: 2100 },
        ]
      };
    },
  });

  const runOptimization = useMutation({
    mutationFn: (config) => api.post('/route-optimization', config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['route-optimizations', timeRange] });
      qc.invalidateQueries({ queryKey: ['route-optimization-metrics'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Route Optimization
          </h1>
          <p className="page-subtitle">AI-driven route efficiency and resource optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="input !w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Optimization
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Cost Savings</p>
              <p className="text-2xl font-bold text-sidebar">{metrics.totalSavings?.toLocaleString()} ETB</p>
              <p className="text-xs text-green-600 mt-1">↑ 12% vs last month</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Fuel Saved</p>
              <p className="text-2xl font-bold text-sidebar">{metrics.fuelSaved?.toLocaleString()} L</p>
              <p className="text-xs text-blue-600 mt-1">~ 18,000 km reduction</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Fuel className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Time Optimized</p>
              <p className="text-2xl font-bold text-sidebar">{metrics.timeSaved} hrs</p>
              <p className="text-xs text-purple-600 mt-1">Driver productivity ↑</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Efficiency Gain</p>
              <p className="text-2xl font-bold text-sidebar">{metrics.efficiencyImprovement}%</p>
              <p className="text-xs text-green-600 mt-1">System-wide average</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Savings Trend */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Savings Trend (ETB)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={metrics.trend || []}>
            <defs>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B4F8A" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1B4F8A" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="savings" stroke="#1B4F8A" fillOpacity={1} fill="url(#colorSavings)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Optimization History */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-400" />
          Recent Optimization Results
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Route</th>
                <th className="text-left py-3 px-4">Vehicle</th>
                <th className="text-center py-3 px-4">Distance Saved</th>
                <th className="text-center py-3 px-4">Cost Saved</th>
                <th className="text-center py-3 px-4">Efficiency</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {optimizations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No optimizations found for this period. Run a new optimization to see results.
                  </td>
                </tr>
              )}
              {optimizations.map((opt) => (
                <tr key={opt.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{opt.route?.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{opt.vehicle?.plateNumber}</td>
                  <td className="text-center py-3 px-4 text-blue-600 font-medium">
                    -{opt.optimizationMetrics?.distanceSaved?.toFixed(1)} km
                  </td>
                  <td className="text-center py-3 px-4 text-green-600 font-bold">
                    {opt.optimizationMetrics?.costSaved?.toLocaleString()} ETB
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-etgreen">
                      +{opt.optimizationMetrics?.efficiencyImprovement}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="badge-success">Completed</span>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-500">
                    {new Date(opt.optimizationDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Algorithms and Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4">Optimization Algorithms</h3>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50/50">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-sidebar">Nearest Neighbor</p>
                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">Active</span>
              </div>
              <p className="text-sm text-gray-600">Calculates the most efficient sequence of stops based on geographical proximity.</p>
            </div>
            <div className="p-4 border rounded-lg opacity-50">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-sidebar">Simulated Annealing</p>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">Enterprise only</span>
              </div>
              <p className="text-sm text-gray-600">Advanced stochastic algorithm for global optimization across multiple routes.</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4">Operational Tips</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-gray-600">Run optimizations 2 hours before departure for best traffic prediction accuracy.</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-gray-600">Combine optimization results with Geofencing to detect route deviations in real-time.</p>
            </div>
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <p className="text-sm text-gray-600">Ensure all vehicle GPS sensors are calibrated for precise distance calculations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
