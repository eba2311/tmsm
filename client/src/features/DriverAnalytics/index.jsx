import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Award, Clock, MapPin, Star, AlertTriangle, Calendar } from 'lucide-react';

const COLORS = ['#1B4F8A', '#C9920A', '#2D7D3A', '#B5251A', '#6B7280'];

export default function DriverAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedDriver, setSelectedDriver] = useState(null);

  const { data: driverPerformance = [], isLoading: perfLoading } = useQuery({
    queryKey: ['driver-performance', timeRange],
    queryFn: async () => {
      const { data } = await api.get('/driver-analytics/performance', { 
        params: { 
          startDate: timeRange === '7d' ? new Date(Date.now() - 7*24*60*60*1000).toISOString() : undefined,
          endDate: timeRange === '30d' ? new Date(Date.now() - 30*24*60*60*1000).toISOString() : undefined
        } 
      });
      return data.data || [];
    },
  });

  const { data: topDrivers = [], isLoading: topLoading } = useQuery({
    queryKey: ['driver-top', timeRange],
    queryFn: async () => {
      const { data } = await api.get('/driver-analytics/top-drivers/all', { params: { limit: 10 } });
      return data.data || [];
    },
  });

  const performanceDistribution = driverPerformance.reduce((acc, driver) => {
    const avgPassengers = parseFloat(driver.avgPassengersPerTrip || 0);
    let category = 'Low';
    if (avgPassengers >= 40) category = 'Excellent';
    else if (avgPassengers >= 30) category = 'Good';
    else if (avgPassengers >= 20) category = 'Average';
    else if (avgPassengers >= 10) category = 'Below Average';
    
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(performanceDistribution).map(([name, value]) => ({ name, value }));

  const totalTrips = driverPerformance.reduce((sum, d) => sum + (d.totalTrips || 0), 0);
  const avgPassengers = driverPerformance.length > 0 ? driverPerformance.reduce((sum, d) => sum + parseFloat(d.avgPassengersPerTrip || 0), 0) / driverPerformance.length : 0;
  const totalRevenue = driverPerformance.reduce((sum, d) => sum + parseFloat(d.totalRevenue || 0), 0);

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Driver Performance Analytics
          </h1>
          <p className="page-subtitle">Comprehensive driver performance metrics and insights</p>
        </div>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="input !w-auto"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Trips</p>
              <p className="text-2xl font-bold text-sidebar">{totalTrips.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Avg Passengers/Trip</p>
              <p className="text-2xl font-bold text-sidebar">{avgPassengers.toFixed(1)}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-sidebar">{totalRevenue.toLocaleString()} ETB</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active Drivers</p>
              <p className="text-2xl font-bold text-sidebar">{driverPerformance.length}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4">Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Trends */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4">Top Drivers by Revenue</h3>
          <div className="space-y-3">
            {topDrivers.slice(0, 5).map((driver, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">{i+1}</div>
                  <div>
                    <p className="font-semibold text-sidebar">{driver.name}</p>
                    <p className="text-xs text-gray-500">{driver.totalTrips} trips</p>
                  </div>
                </div>
                <p className="font-black text-primary">{parseFloat(driver.totalRevenue).toLocaleString()} ETB</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Top Performers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topDrivers.slice(0, 6).map((driver, index) => (
            <div key={driver.driverId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-sidebar">{driver.name}</p>
                    <p className="text-xs text-gray-500">{driver.licenseNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{parseFloat(driver.avgPassengersPerTrip || 0).toFixed(1)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Trips</p>
                  <p className="font-semibold">{driver.totalTrips || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Revenue</p>
                  <p className="font-semibold">{(parseFloat(driver.totalRevenue) || 0).toLocaleString()} ETB</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Passengers</p>
                  <p className="font-semibold">{driver.totalPassengers || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Avg/Trip</p>
                  <p className="font-semibold">{parseFloat(driver.avgPassengersPerTrip || 0).toFixed(1)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Analytics Table */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Detailed Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Driver</th>
                <th className="text-center py-3 px-4">Trips</th>
                <th className="text-center py-3 px-4">Passengers</th>
                <th className="text-center py-3 px-4">Revenue</th>
                <th className="text-center py-3 px-4">Avg Pass/Trip</th>
                <th className="text-center py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {driverPerformance.map((driver) => (
                <tr key={driver.driverId} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-xs text-gray-500">{driver.licenseNumber}</p>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">{driver.totalTrips}</td>
                  <td className="text-center py-3 px-4">{driver.totalPassengers}</td>
                  <td className="text-center py-3 px-4 font-bold">{parseFloat(driver.totalRevenue).toLocaleString()} ETB</td>
                  <td className="text-center py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {parseFloat(driver.avgPassengersPerTrip).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`badge-${driver.isActive ? 'green' : 'gray'}`}>
                      {driver.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
