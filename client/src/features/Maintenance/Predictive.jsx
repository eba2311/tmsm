import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Wrench, BrainCircuit, AlertCircle, Calendar, 
  TrendingUp, Activity, Bus, ShieldCheck, Gauge,
  ArrowRight, Sparkles, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

export default function PredictiveMaintenance() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['predictive-maintenance'],
    queryFn: async () => {
      const { data } = await api.get('/predictive-maintenance');
      return data.data || [];
    },
  });

  const scheduleMut = useMutation({
    mutationFn: () => api.post('/predictive-maintenance/schedule-high-priority'),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'High priority tasks scheduled');
      qc.invalidateQueries({ queryKey: ['predictive-maintenance'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to schedule tasks');
    }
  });

  const radarData = [
    { subject: 'Engine', A: 120, fullMark: 150 },
    { subject: 'Brakes', A: 98, fullMark: 150 },
    { subject: 'Tires', A: 86, fullMark: 150 },
    { subject: 'Battery', A: 99, fullMark: 150 },
    { subject: 'Oil', A: 85, fullMark: 150 },
    { subject: 'Lights', A: 65, fullMark: 150 },
  ];

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            Predictive Maintenance
          </h1>
          <p className="page-subtitle">AI-powered forecasting of vehicle maintenance needs</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn-secondary flex items-center gap-2"
            onClick={() => scheduleMut.mutate()}
            disabled={scheduleMut.isPending}
          >
            <Calendar className="w-4 h-4" /> {scheduleMut.isPending ? 'Scheduling...' : 'Schedule All High Priority'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="card p-4 bg-sidebar text-white overflow-hidden relative">
            <Sparkles className="absolute top-[-10px] right-[-10px] w-24 h-24 text-white/5" />
            <h3 className="font-semibold mb-4 flex items-center gap-2 relative z-10">
              <Activity className="w-4 h-4 text-gold" />
              Fleet Health Score
            </h3>
            <div className="text-center relative z-10">
              <p className="text-5xl font-black text-gold">84%</p>
              <p className="text-sm text-white/60 mt-1 uppercase tracking-widest">Optimized</p>
            </div>
            <div className="mt-6 space-y-3 relative z-10">
              <div className="flex justify-between text-xs">
                <span>Predictive Accuracy</span>
                <span className="text-gold">92%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gold h-full w-[92%]" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-sidebar mb-4">Urgent Attention</h3>
            <div className="space-y-3">
              {predictions.filter(p => p.prediction?.urgency === 'HIGH').map(p => (
                <div 
                  key={p.vehicle}
                  onClick={() => setSelectedVehicle(p)}
                  className="p-3 border-2 border-red-100 bg-red-50 rounded-xl cursor-pointer hover:border-red-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-red-700">{p.plateNumber}</span>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-xs text-red-600 font-medium">Maintenance due in {p.prediction.daysUntilMaintenance} days</p>
                </div>
              ))}
              {predictions.filter(p => p.prediction?.urgency === 'HIGH').length === 0 && (
                <div className="text-center py-6">
                  <ShieldCheck className="w-10 h-10 text-etgreen/30 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No high-priority tasks.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Mileage to Failure</p>
                <p className="text-xl font-bold text-sidebar">42,500 km</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Predicted Downtime Reduction</p>
                <p className="text-xl font-bold text-sidebar">28.5%</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-sidebar mb-6">Component Failure Probability</h3>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-full lg:w-1/2">
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} />
                    <Radar name="Vehicle Health" dataKey="A" stroke="#1B4F8A" fill="#1B4F8A" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/2 space-y-4">
                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest">AI Insights</h4>
                <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-primary">
                  <p className="text-sm text-sidebar font-semibold mb-1">Engine & Brakes Warning</p>
                  <p className="text-xs text-gray-600">Based on historical thermal patterns, we recommend cooling system inspection for 15% of the fleet.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-gold">
                  <p className="text-sm text-sidebar font-semibold mb-1">Tire Replacement Window</p>
                  <p className="text-xs text-gray-600">Next batch of tire replacements predicted for July 2026. Suggest bulk purchasing to save 12%.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-sidebar mb-4">AI Forecast Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Predicted Issue</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.slice(0, 10).map((p) => (
                    <tr key={p.vehicle} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Bus className="w-4 h-4 text-primary" />
                          <span className="font-medium">{p.plateNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-gray-600">
                          {p.prediction?.predictedIssues?.[0] || 'Regular Service'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 h-1 rounded-full overflow-hidden">
                            <div className="bg-primary h-full" style={{ width: `${(p.prediction?.confidence || 0) * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500">{(p.prediction?.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase
                          ${p.prediction?.urgency === 'HIGH' ? 'bg-red-100 text-red-600' :
                            p.prediction?.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'}`}>
                          {p.prediction?.urgency} • {p.prediction?.daysUntilMaintenance}d
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button 
                          className="text-primary hover:text-sidebar flex items-center gap-1 font-bold text-xs"
                          onClick={() => navigate('/maintenance')}
                        >
                          Plan <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
