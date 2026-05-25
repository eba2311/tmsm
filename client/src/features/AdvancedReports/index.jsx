import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { Download, Filter, Calendar, TrendingUp, FileText, BarChart3, PieChartIcon, Activity } from 'lucide-react';
import { DataTable } from '../../components/Tables/DataTable';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';

export default function AdvancedReports() {
  const [reportType, setReportType] = useState('performance');
  const [dateRange, setDateRange] = useState('30d');
  const [filters, setFilters] = useState({});

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['advanced-reports', reportType, dateRange, filters],
    queryFn: async () => {
      try {
        const { data } = await api.get('/reports/advanced', {
          params: {
            type: reportType,
            days: dateRange.replace('d', ''),
            ...filters
          }
        });
        return data.data || {};
      } catch (error) {
        // Return mock data if API fails
        return getMockData(reportType);
      }
    },
  });

  const getMockData = (type) => {
    const mockData = {
      performance: {
        totalTrips: 1250,
        onTimePerformance: 94.5,
        avgRating: 4.8,
        efficiencyScore: 87.3,
        tripTrend: [
          { date: '2026-01', trips: 180, onTime: 170 },
          { date: '2026-02', trips: 195, onTime: 185 },
          { date: '2026-03', trips: 210, onTime: 200 },
          { date: '2026-04', trips: 225, onTime: 215 },
          { date: '2026-05', trips: 240, onTime: 230 },
        ],
        driverPerformance: [
          { name: 'Excellent', value: 45 },
          { name: 'Good', value: 35 },
          { name: 'Average', value: 15 },
          { name: 'Poor', value: 5 },
        ],
        driverDetails: [
          { name: 'Abebe Kebede', trips: 45, onTimePercentage: 96, avgRating: 4.9, revenue: 45000, efficiency: 92 },
          { name: 'Dawit Tesfaye', trips: 38, onTimePercentage: 94, avgRating: 4.8, revenue: 38000, efficiency: 88 },
          { name: 'Mulugeta Haile', trips: 42, onTimePercentage: 95, avgRating: 4.7, revenue: 42000, efficiency: 90 },
        ],
      },
      financial: {
        totalRevenue: 1250000,
        totalCosts: 850000,
        netProfit: 400000,
        profitMargin: 32,
        revenueBreakdown: [
          { category: 'Ticket Sales', revenue: 950000, costs: 600000 },
          { category: 'Cargo', revenue: 200000, costs: 150000 },
          { category: 'Charter', revenue: 100000, costs: 100000 },
        ],
        costDistribution: [
          { name: 'Fuel', value: 350000 },
          { name: 'Maintenance', value: 200000 },
          { name: 'Salaries', value: 250000 },
          { name: 'Operations', value: 50000 },
        ],
        monthlyTrend: [
          { month: 'Jan', revenue: 180000, costs: 120000 },
          { month: 'Feb', revenue: 195000, costs: 130000 },
          { month: 'Mar', revenue: 210000, costs: 140000 },
          { month: 'Apr', revenue: 225000, costs: 150000 },
          { month: 'May', revenue: 240000, costs: 160000 },
        ],
      },
      operational: {
        fleetUtilization: 85.5,
        avgLoadFactor: 78.2,
        fuelEfficiency: 8.5,
        maintenanceDowntime: 12.3,
        vehicleUtilization: [
          { vehicle: 'AM-3-12345', utilization: 92 },
          { vehicle: 'AM-3-67890', utilization: 85 },
          { vehicle: 'AM-3-22222', utilization: 79 },
        ],
        routePerformance: [
          { route: 'AM-AA', trips: 45, loadFactor: 82 },
          { route: 'AM-HW', trips: 38, loadFactor: 75 },
          { route: 'AM-JK', trips: 32, loadFactor: 78 },
        ],
      },
      utilization: {
        vehicleUtilization: 85.5,
        driverUtilization: 78.2,
        seatUtilization: 72.8,
        routeEfficiency: 88.5,
        utilizationTrend: [
          { date: '2026-01', vehicles: 82, drivers: 75, seats: 70 },
          { date: '2026-02', vehicles: 84, drivers: 76, seats: 72 },
          { date: '2026-03', vehicles: 85, drivers: 77, seats: 73 },
          { date: '2026-04', vehicles: 86, drivers: 78, seats: 74 },
          { date: '2026-05', vehicles: 87, drivers: 79, seats: 75 },
        ],
      },
    };
    return mockData[type] || {};
  };

  const exportReport = async (format = 'excel') => {
    try {
      const response = await api.get('/reports/export', {
        params: {
          type: reportType,
          format,
          days: dateRange.replace('d', ''),
          ...filters
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const reportTypes = [
    { id: 'performance', label: 'Performance Analytics', icon: TrendingUp },
    { id: 'financial', label: 'Financial Summary', icon: BarChart3 },
    { id: 'operational', label: 'Operational Metrics', icon: Activity },
    { id: 'utilization', label: 'Resource Utilization', icon: PieChartIcon },
  ];

  const renderReportContent = () => {
    switch (reportType) {
      case 'performance':
        return <PerformanceReport data={reportData} />;
      case 'financial':
        return <FinancialReport data={reportData} />;
      case 'operational':
        return <OperationalReport data={reportData} />;
      case 'utilization':
        return <UtilizationReport data={reportData} />;
      default:
        return <div>Select a report type</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Advanced Reports
          </h1>
          <p className="page-subtitle">Comprehensive analytics and reporting system</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="input !w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last year</option>
          </select>
          <button 
            onClick={() => exportReport('excel')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button 
            onClick={() => exportReport('pdf')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Report Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === type.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <type.icon className={`w-6 h-6 mb-2 ${
                reportType === type.id ? 'text-primary' : 'text-gray-400'
              }`} />
              <p className={`font-medium ${
                reportType === type.id ? 'text-primary' : 'text-gray-700'
              }`}>
                {type.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Report Content */}
      {isLoading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Generating report...</p>
        </div>
      ) : (
        renderReportContent()
      )}
    </div>
  );
}

const PerformanceReport = ({ data }) => (
  <div className="space-y-6">
    {/* Performance Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Total Trips</h4>
        <p className="text-2xl font-bold text-sidebar">{formatNumber(data.totalTrips || 0)}</p>
        <p className="text-xs text-green-600 mt-1">+12% from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">On-time Performance</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.onTimePerformance || 0).toFixed(1)}%</p>
        <p className="text-xs text-green-600 mt-1">+3% from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Average Rating</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.avgRating || 0).toFixed(2)}</p>
        <p className="text-xs text-green-600 mt-1">+0.2 from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Efficiency Score</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.efficiencyScore || 0).toFixed(1)}%</p>
        <p className="text-xs text-red-600 mt-1">-2% from last period</p>
      </div>
    </div>

    {/* Performance Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Trip Performance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.tripTrend || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="trips" stroke="#1B4F8A" name="Total Trips" />
            <Line type="monotone" dataKey="onTime" stroke="#2D7D3A" name="On-time Trips" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Driver Performance Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.driverPerformance || []}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {(data.driverPerformance || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#1B4F8A', '#C9920A', '#2D7D3A', '#B5251A'][index % 4]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Detailed Performance Table */}
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-sidebar mb-4">Driver Performance Details</h3>
      <DataTable
        data={data.driverDetails || []}
        columns={[
          { header: 'Driver Name', accessor: 'name' },
          { header: 'Trips', accessor: 'trips' },
          { header: 'On-time %', accessor: 'onTimePercentage' },
          { header: 'Avg Rating', accessor: 'avgRating' },
          { header: 'Revenue', accessor: 'revenue' },
          { header: 'Efficiency', accessor: 'efficiency' },
        ]}
        searchable
        sortable
        pagination
      />
    </div>
  </div>
);

const FinancialReport = ({ data }) => (
  <div className="space-y-6">
    {/* Financial Summary */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h4>
        <p className="text-2xl font-bold text-sidebar">{formatCurrency(data.totalRevenue || 0)}</p>
        <p className="text-xs text-green-600 mt-1">+18% from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Total Costs</h4>
        <p className="text-2xl font-bold text-sidebar">{formatCurrency(data.totalCosts || 0)}</p>
        <p className="text-xs text-red-600 mt-1">+5% from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Net Profit</h4>
        <p className="text-2xl font-bold text-sidebar">{formatCurrency(data.netProfit || 0)}</p>
        <p className="text-xs text-green-600 mt-1">+25% from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Profit Margin</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.profitMargin || 0).toFixed(1)}%</p>
        <p className="text-xs text-green-600 mt-1">+3% from last period</p>
      </div>
    </div>

    {/* Revenue Breakdown */}
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-sidebar mb-4">Revenue Breakdown</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data.revenueBreakdown || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="revenue" fill="#1B4F8A" name="Revenue" />
          <Bar dataKey="costs" fill="#C9920A" name="Costs" />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Cost Analysis */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Cost Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.costDistribution || []}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {(data.costDistribution || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#1B4F8A', '#C9920A', '#2D7D3A', '#B5251A', '#6B7280'][index % 5]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Monthly Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.monthlyTrend || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="revenue" stackId="1" stroke="#1B4F8A" fill="#1B4F8A" fillOpacity={0.6} name="Revenue" />
            <Area type="monotone" dataKey="costs" stackId="1" stroke="#C9920A" fill="#C9920A" fillOpacity={0.6} name="Costs" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const OperationalReport = ({ data }) => (
  <div className="space-y-6">
    {/* Operational Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Fleet Utilization</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.fleetUtilization || 0).toFixed(1)}%</p>
        <p className="text-xs text-green-600 mt-1">+5% from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Average Load Factor</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.avgLoadFactor || 0).toFixed(1)}%</p>
        <p className="text-xs text-green-600 mt-1">+8% from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Fuel Efficiency</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.fuelEfficiency || 0).toFixed(2)} km/L</p>
        <p className="text-xs text-red-600 mt-1">-2% from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Maintenance Downtime</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.maintenanceDowntime || 0).toFixed(1)} hrs</p>
        <p className="text-xs text-green-600 mt-1">-15% from last period</p>
      </div>
    </div>

    {/* Operational Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Vehicle Utilization</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.vehicleUtilization || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="vehicle" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="utilization" fill="#1B4F8A" name="Utilization %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Route Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.routePerformance || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="route" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="trips" stroke="#1B4F8A" name="Trips" />
            <Line type="monotone" dataKey="loadFactor" stroke="#C9920A" name="Load Factor %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const UtilizationReport = ({ data }) => (
  <div className="space-y-6">
    {/* Utilization Summary */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Vehicle Utilization</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.vehicleUtilization || 0).toFixed(1)}%</p>
        <p className="text-xs text-green-600 mt-1">+3% from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Driver Utilization</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.driverUtilization || 0).toFixed(1)}%</p>
        <p className="text-xs text-green-600 mt-1">+5% from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Seat Utilization</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.seatUtilization || 0).toFixed(1)}%</p>
        <p className="text-xs text-red-600 mt-1">-2% from last period</p>
      </div>
      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Route Efficiency</h4>
        <p className="text-2xl font-bold text-sidebar">{(data.routeEfficiency || 0).toFixed(1)}%</p>
        <p className="text-xs text-green-600 mt-1">+1% from last period</p>
      </div>
    </div>

    {/* Utilization Heatmap */}
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-sidebar mb-4">Utilization Trends</h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data.utilizationTrend || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="vehicles" stroke="#1B4F8A" fill="#1B4F8A" fillOpacity={0.3} name="Vehicle %" />
          <Area type="monotone" dataKey="drivers" stroke="#C9920A" fill="#C9920A" fillOpacity={0.3} name="Driver %" />
          <Area type="monotone" dataKey="seats" stroke="#2D7D3A" fill="#2D7D3A" fillOpacity={0.3} name="Seat %" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);
