import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Fuel, TrendingUp, TrendingDown, AlertTriangle, Calendar, DollarSign, Gauge, Filter, Plus, Download } from 'lucide-react';

export default function FuelManagement() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const qc = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    vehicle: '',
    driver: '',
    date: new Date().toISOString().slice(0, 10),
    fuelType: 'DIESEL',
    quantity: 0,
    costPerUnit: 0,
    odometerReading: 0,
    station: '',
  });

  const { data: fuelData = [], isLoading: fuelLoading } = useQuery({
    queryKey: ['fuel-consumption', timeRange, selectedVehicle],
    queryFn: async () => {
      const { data } = await api.get('/fuel-records', { 
        params: { 
          vehicle: selectedVehicle === 'all' ? undefined : selectedVehicle,
          limit: 100
        } 
      });
      return data.data || [];
    },
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles-fuel'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles');
      return data.data || [];
    },
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-fuel'],
    queryFn: async () => {
      const { data } = await api.get('/drivers');
      return data.data || [];
    },
  });

  // Derive alerts from fuelData
  const fuelAlerts = useMemo(() => {
    return fuelData.filter(r => (r.costPerUnit || 0) > 100 || (r.quantity || 0) > 200).map(r => ({
      id: r.id,
      type: (r.costPerUnit || 0) > 100 ? 'High Fuel Cost' : 'Unusual Volume',
      message: (r.costPerUnit || 0) > 100 ? `Fuel cost per liter (${r.costPerUnit} ETB) is above threshold.` : `Large fuel volume (${r.quantity} L) detected.`,
      vehicle: r.vehicle,
      created_at: r.date,
      severity: (r.costPerUnit || 0) > 150 ? 'high' : 'medium'
    }));
  }, [fuelData]);

  const addFuelRecord = useMutation({
    mutationFn: (record) => api.post('/fuel-records', record),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fuel-consumption'] });
      setIsModalOpen(false);
      setNewRecord({ vehicle: '', driver: '', date: new Date().toISOString().slice(0, 10), fuelType: 'DIESEL', quantity: 0, costPerUnit: 0, odometerReading: 0, station: '' });
    },
  });

  // Calculate metrics
  const totalConsumption = fuelData.reduce((sum, record) => sum + (record.liters || 0), 0);
  const totalCost = fuelData.reduce((sum, record) => sum + (record.cost || 0), 0);
  const avgConsumption = fuelData.length > 0 ? totalConsumption / fuelData.length : 0;
  const efficiency = fuelData.length > 0 ? 
    (fuelData.reduce((sum, record) => sum + (record.distance || 0), 0) / totalConsumption).toFixed(2) : 0;

  // Prepare chart data
  const consumptionTrend = fuelData.reduce((acc, record) => {
    const date = new Date(record.date).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.consumption += record.liters || 0;
      existing.cost += record.cost || 0;
    } else {
      acc.push({
        date,
        consumption: record.liters || 0,
        cost: record.cost || 0,
        distance: record.distance || 0
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  const vehicleEfficiency = vehicles.map(vehicle => {
    const vehicleRecords = fuelData.filter(record => record.vehicle?.id === vehicle.id || record.vehicle === vehicle.id);
    const totalLiters = vehicleRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const totalDistance = vehicleRecords.reduce((sum, r) => sum + (r.distanceTraveled || 0), 0);
    return {
      name: vehicle.plateNumber,
      efficiency: totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : 0,
      consumption: totalLiters,
      cost: vehicleRecords.reduce((sum, r) => sum + (r.costPerUnit * r.quantity || 0), 0)
    };
  });

  const costAnalysis = consumptionTrend.map(t => ({
    date: t.date,
    totalCost: t.cost,
    avgCostPerLiter: t.consumption > 0 ? (t.cost / t.consumption).toFixed(2) : 0,
    efficiency: t.consumption > 0 ? (t.distance / t.consumption).toFixed(2) : 0
  }));

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Fuel className="w-6 h-6 text-primary" />
            Fuel Management
          </h1>
          <p className="page-subtitle">Track fuel consumption, costs, and efficiency metrics</p>
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
          <select 
            value={selectedVehicle} 
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="input !w-auto"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plateNumber}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Consumption</p>
              <p className="text-2xl font-bold text-sidebar">{totalConsumption.toFixed(1)} L</p>
              <p className="text-xs text-gray-400 mt-1">Avg: {avgConsumption.toFixed(1)} L/record</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Fuel className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold text-sidebar">{totalCost.toLocaleString()} ETB</p>
              <p className="text-xs text-gray-400 mt-1">Avg: {totalConsumption > 0 ? (totalCost / totalConsumption).toFixed(2) : 0} ETB/L</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Efficiency</p>
              <p className="text-2xl font-bold text-sidebar">{efficiency} km/L</p>
              <p className="text-xs text-gray-400 mt-1">Distance per liter</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Gauge className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active Alerts</p>
              <p className="text-2xl font-bold text-sidebar">{fuelAlerts.length}</p>
              <p className="text-xs text-gray-400 mt-1">Requires attention</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumption Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4">Consumption Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={consumptionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="consumption" stroke="#1B4F8A" fill="#1B4F8A" fillOpacity={0.6} name="Liters" />
              <Area type="monotone" dataKey="cost" stroke="#C9920A" fill="#C9920A" fillOpacity={0.6} name="Cost (ETB)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Efficiency */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4">Vehicle Efficiency (km/L)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehicleEfficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="efficiency" fill="#2D7D3A" name="km/L" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fuel Alerts */}
      {fuelAlerts.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Fuel Alerts
          </h3>
          <div className="space-y-3">
            {fuelAlerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-red-800">{alert.type}</p>
                    <p className="text-sm text-red-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-red-500 mt-2">
                      Vehicle: {alert.vehicle?.plateNumber} • {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Fuel Records */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-sidebar">Recent Fuel Records</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>

        {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
              <h2 className="text-xl font-bold">Add Fuel Record</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                addFuelRecord.mutate({
                  vehicle: newRecord.vehicle,
                  driver: newRecord.driver,
                  date: new Date(newRecord.date).toISOString(),
                  fuelType: newRecord.fuelType,
                  quantity: Number(newRecord.quantity),
                  costPerUnit: Number(newRecord.costPerUnit),
                  odometerReading: Number(newRecord.odometerReading),
                  station: newRecord.station,
                });
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Vehicle</label>
                  <select 
                    className="input"
                    value={newRecord.vehicle}
                    onChange={(e) => setNewRecord({ ...newRecord, vehicle: e.target.value })}
                    required
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plateNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Driver</label>
                  <select 
                    className="input"
                    value={newRecord.driver}
                    onChange={(e) => setNewRecord({ ...newRecord, driver: e.target.value })}
                  >
                    <option value="">Select driver...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.user?.name} ({d.licenseNumber})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date</label>
                  <input 
                    type="date"
                    className="input"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fuel Type</label>
                  <select 
                    className="input"
                    value={newRecord.fuelType}
                    onChange={(e) => setNewRecord({ ...newRecord, fuelType: e.target.value })}
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantity (Liters)</label>
                  <input 
                    type="number"
                    className="input"
                    value={newRecord.quantity}
                    onChange={(e) => setNewRecord({ ...newRecord, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cost/Liter (ETB)</label>
                  <input 
                    type="number"
                    className="input"
                    value={newRecord.costPerUnit}
                    onChange={(e) => setNewRecord({ ...newRecord, costPerUnit: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Odometer</label>
                  <input 
                    type="number"
                    className="input"
                    value={newRecord.odometerReading}
                    onChange={(e) => setNewRecord({ ...newRecord, odometerReading: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Station</label>
                  <input 
                    type="text"
                    className="input"
                    value={newRecord.station}
                    onChange={(e) => setNewRecord({ ...newRecord, station: e.target.value })}
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
                  disabled={addFuelRecord.isPending}
                  className="flex-1 btn-primary"
                >
                  {addFuelRecord.isPending ? 'Saving...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Vehicle</th>
                <th className="text-center py-3 px-4">Liters</th>
                <th className="text-center py-3 px-4">Cost (ETB)</th>
                <th className="text-center py-3 px-4">Distance (km)</th>
                <th className="text-center py-3 px-4">Efficiency</th>
                <th className="text-left py-3 px-4">Driver</th>
              </tr>
            </thead>
            <tbody>
              {fuelData.slice(0, 10).map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{record.vehicle?.plateNumber}</p>
                      <p className="text-xs text-gray-500">{record.vehicle?.model}</p>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">{record.quantity?.toFixed(1) || 0} L</td>
                  <td className="text-center py-3 px-4">{((record.costPerUnit || 0) * (record.quantity || 0)).toLocaleString()}</td>
                  <td className="text-center py-3 px-4">{record.distanceTraveled || 0}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      (record.fuelEfficiency || 0) >= 10 ? 'bg-green-100 text-green-800' :
                      (record.fuelEfficiency || 0) >= 7 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(record.fuelEfficiency || 0).toFixed(2)} km/L
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm">{record.driver?.name}</p>
                      <p className="text-xs text-gray-500">{record.driver?.licenseNumber}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Analysis */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Cost Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={costAnalysis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="totalCost" stroke="#B5251A" name="Daily Cost" strokeWidth={2} />
            <Line type="monotone" dataKey="avgCostPerLiter" stroke="#1B4F8A" name="Avg Cost/Liter" strokeWidth={2} />
            <Line type="monotone" dataKey="efficiency" stroke="#2D7D3A" name="Avg Efficiency" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
