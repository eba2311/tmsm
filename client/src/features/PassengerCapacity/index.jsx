import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, TrendingDown, AlertTriangle, Clock, MapPin, Filter, Eye, Bus, Calendar, Activity } from 'lucide-react';

const COLORS = ['#1B4F8A', '#C9920A', '#2D7D3A', '#B5251A', '#6B7280'];

const capacityLevels = {
  LOW: { color: 'bg-green-100 text-green-800', threshold: 30 },
  MEDIUM: { color: 'bg-yellow-100 text-yellow-800', threshold: 60 },
  HIGH: { color: 'bg-orange-100 text-orange-800', threshold: 85 },
  CRITICAL: { color: 'bg-red-100 text-red-800', threshold: 100 }
};

export default function PassengerCapacity() {
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const qc = useQueryClient();

  const { data: capacityData = [], isLoading: capacityLoading } = useQuery({
    queryKey: ['passenger-capacity', timeRange, selectedRoute, selectedVehicle],
    queryFn: async () => {
      const { data } = await api.get('/capacity/realtime', {
        params: {
          hours: timeRange.replace('h', ''),
          routeId: selectedRoute === 'all' ? undefined : selectedRoute,
          vehicleId: selectedVehicle === 'all' ? undefined : selectedVehicle
        }
      });
      return data.data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['routes-capacity'],
    queryFn: async () => {
      const { data } = await api.get('/routes');
      return data.data || [];
    },
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles-capacity'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles');
      return data.data || [];
    },
  });

  const { data: capacityTrends = [], isLoading: trendsLoading } = useQuery({
    queryKey: ['capacity-trends', timeRange],
    queryFn: async () => {
      const { data } = await api.get('/capacity/trends', {
        params: { hours: timeRange.replace('h', '') }
      });
      return data.data || [];
    },
  });

  const { data: overcrowdingAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['capacity-alerts'],
    queryFn: async () => {
      const { data } = await api.get('/capacity/alerts');
      return data.data || [];
    },
  });

  // Calculate metrics
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.capacity || 0), 0);
  const currentOccupancy = capacityData.reduce((sum, v) => sum + (v.currentPassengers || 0), 0);
  const averageOccupancy = totalCapacity > 0 ? (currentOccupancy / totalCapacity * 100).toFixed(1) : 0;
  const overcrowdedVehicles = capacityData.filter(v => {
    const percentage = v.capacity > 0 ? (v.currentPassengers / v.capacity * 100) : 0;
    return percentage >= 90;
  }).length;

  // Prepare chart data
  const hourlyTrends = capacityTrends.reduce((acc, record) => {
    const hour = new Date(record.timestamp).getHours();
    const existing = acc.find(item => item.hour === hour);
    if (existing) {
      existing.occupancy += record.occupancy || 0;
      existing.count++;
    } else {
      acc.push({
        hour: `${hour}:00`,
        occupancy: record.occupancy || 0,
        count: 1,
        passengers: record.passengers || 0
      });
    }
    return acc;
  }, []).map(item => ({
    hour: item.hour,
    occupancy: item.count > 0 ? item.occupancy / item.count : 0,
    passengers: item.passengers
  })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  const routeCapacityDistribution = routes.map(route => {
    const routeVehicles = capacityData.filter(v => v.assignedRoute?.id === route.id);
    const totalRouteCapacity = routeVehicles.reduce((sum, v) => sum + (v.capacity || 0), 0);
    const totalRouteOccupancy = routeVehicles.reduce((sum, v) => sum + (v.currentPassengers || 0), 0);
    return {
      name: route.name,
      capacity: totalRouteCapacity,
      occupancy: totalRouteOccupancy,
      percentage: totalRouteCapacity > 0 ? (totalRouteOccupancy / totalRouteCapacity * 100).toFixed(1) : 0
    };
  });

  const getCapacityLevel = (percentage) => {
    if (percentage <= capacityLevels.LOW.threshold) return 'LOW';
    if (percentage <= capacityLevels.MEDIUM.threshold) return 'MEDIUM';
    if (percentage <= capacityLevels.HIGH.threshold) return 'HIGH';
    return 'CRITICAL';
  };

  const getCapacityColor = (percentage) => {
    const level = getCapacityLevel(percentage);
    return capacityLevels[level].color;
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Passenger Capacity Monitoring
          </h1>
          <p className="page-subtitle">Real-time passenger load and capacity utilization</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="input !w-auto"
          >
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="168h">Last 7 days</option>
          </select>
          <select 
            value={selectedRoute} 
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="input !w-auto"
          >
            <option value="all">All Routes</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
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
              <p className="text-xs text-gray-500">Total Capacity</p>
              <p className="text-2xl font-bold text-sidebar">{totalCapacity}</p>
              <p className="text-xs text-gray-400 mt-1">Available seats</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bus className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Current Occupancy</p>
              <p className="text-2xl font-bold text-sidebar">{currentOccupancy}</p>
              <p className="text-xs text-gray-400 mt-1">{averageOccupancy}% utilization</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Overcrowded Vehicles</p>
              <p className="text-2xl font-bold text-red-600">{overcrowdedVehicles}</p>
              <p className="text-xs text-gray-400 mt-1">≥90% capacity</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Average Load</p>
              <p className="text-2xl font-bold text-sidebar">{averageOccupancy}%</p>
              <p className="text-xs text-gray-400 mt-1">System utilization</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Activity className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Overcrowding Alerts */}
      {overcrowdingAlerts.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Overcrowding Alerts
          </h3>
          <div className="space-y-3">
            {overcrowdingAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-red-800">{alert.vehicle?.plateNumber} - {alert.route?.name}</p>
                    <p className="text-sm text-red-600 mt-1">
                      {alert.currentPassengers}/{alert.capacity} passengers ({alert.occupancyPercentage}%)
                    </p>
                    <p className="text-xs text-red-500 mt-2">
                      {new Date(alert.timestamp).toLocaleString()} • Duration: {alert.duration} minutes
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity?.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Trends */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4">Hourly Occupancy Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="occupancy" stroke="#1B4F8A" fill="#1B4F8A" fillOpacity={0.6} name="Occupancy %" />
              <Area type="monotone" dataKey="passengers" stroke="#C9920A" fill="#C9920A" fillOpacity={0.6} name="Passengers" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Route Capacity Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4">Route Capacity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={routeCapacityDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="capacity" fill="#1B4F8A" name="Capacity" />
              <Bar dataKey="occupancy" fill="#2D7D3A" name="Current Occupancy" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Vehicle Status */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-500" />
          Real-time Vehicle Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capacityData.map((vehicle) => {
            const occupancyPercentage = vehicle.capacity > 0 ? (vehicle.currentPassengers / vehicle.capacity * 100) : 0;
            const capacityLevel = getCapacityLevel(occupancyPercentage);
            
            return (
              <div key={vehicle.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sidebar">{vehicle.plateNumber}</p>
                      <p className="text-xs text-gray-500">{vehicle.assignedRoute?.name || 'No route'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCapacityColor(occupancyPercentage)}`}>
                    {capacityLevel}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Occupancy</span>
                      <span className="font-medium">{vehicle.currentPassengers}/{vehicle.capacity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          occupancyPercentage <= 30 ? 'bg-green-500' :
                          occupancyPercentage <= 60 ? 'bg-yellow-500' :
                          occupancyPercentage <= 85 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{occupancyPercentage.toFixed(1)}% full</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Speed</p>
                      <p className="font-medium">{vehicle.speed || 0} km/h</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Last Update</p>
                      <p className="font-medium">{new Date(vehicle.lastUpdate).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {occupancyPercentage >= 90 && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      Overcrowded - Consider dispatch
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Capacity Utilization Pie Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Capacity Utilization Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Low (0-30%)', value: capacityData.filter(v => {
                    const pct = v.capacity > 0 ? (v.currentPassengers / v.capacity * 100) : 0;
                    return pct <= 30;
                  }).length },
                  { name: 'Medium (31-60%)', value: capacityData.filter(v => {
                    const pct = v.capacity > 0 ? (v.currentPassengers / v.capacity * 100) : 0;
                    return pct > 30 && pct <= 60;
                  }).length },
                  { name: 'High (61-85%)', value: capacityData.filter(v => {
                    const pct = v.capacity > 0 ? (v.currentPassengers / v.capacity * 100) : 0;
                    return pct > 60 && pct <= 85;
                  }).length },
                  { name: 'Critical (86-100%)', value: capacityData.filter(v => {
                    const pct = v.capacity > 0 ? (v.currentPassengers / v.capacity * 100) : 0;
                    return pct > 85;
                  }).length }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-4">
            <h4 className="font-medium text-sidebar">Capacity Level Legend</h4>
            <div className="space-y-2">
              {Object.entries(capacityLevels).map(([level, config]) => (
                <div key={level} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    level === 'LOW' ? 'bg-green-500' :
                    level === 'MEDIUM' ? 'bg-yellow-500' :
                    level === 'HIGH' ? 'bg-orange-500' :
                    'bg-red-500'
                  }`} />
                  <span className="text-sm">{level.replace('_', ' ')} (≤{config.threshold}%)</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Monitor vehicles in the HIGH and CRITICAL ranges to optimize service and passenger comfort.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
