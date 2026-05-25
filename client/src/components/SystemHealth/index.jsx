import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Activity, CheckCircle, AlertTriangle, XCircle, Server, Database, Wifi, Clock, TrendingUp, TrendingDown } from 'lucide-react';

export default function SystemHealth() {
  const [systemStatus, setSystemStatus] = useState('loading');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: healthData, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const { data } = await api.get('/system/health');
      return data.data || {};
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const { data } = await api.get('/system/metrics');
      return data.data || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  useEffect(() => {
    if (healthData) {
      const overallStatus = determineOverallStatus(healthData);
      setSystemStatus(overallStatus);
      setLastUpdate(new Date());
    }
  }, [healthData]);

  const determineOverallStatus = (data) => {
    const checks = [
      data.database?.status,
      data.api?.status,
      data.websocket?.status,
      data.redis?.status,
      data.external_apis?.status
    ];

    if (checks.includes('error') || checks.includes('down')) {
      return 'error';
    } else if (checks.includes('warning')) {
      return 'warning';
    } else if (checks.every(check => check === 'healthy' || check === 'ok')) {
      return 'healthy';
    } else {
      return 'unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getTrendIcon = (current, previous) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    } else {
      return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-gray-500">Loading system health...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(systemStatus)}
            <div>
              <h2 className="text-xl font-bold text-sidebar">System Status</h2>
              <p className="text-sm text-gray-500 capitalize">{systemStatus}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Last updated</p>
            <p className="text-sm font-medium">{lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Database */}
        <div className={`card p-4 border-2 ${getStatusColor(healthData.database?.status)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <h3 className="font-semibold">Database</h3>
            </div>
            {getStatusIcon(healthData.database?.status)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Response Time:</span>
              <span className="font-medium">{healthData.database?.responseTime || 0}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Connections:</span>
              <span className="font-medium">{healthData.database?.connections || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime:</span>
              <span className="font-medium">{formatUptime(healthData.database?.uptime || 0)}</span>
            </div>
          </div>
        </div>

        {/* API Server */}
        <div className={`card p-4 border-2 ${getStatusColor(healthData.api?.status)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              <h3 className="font-semibold">API Server</h3>
            </div>
            {getStatusIcon(healthData.api?.status)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Response Time:</span>
              <span className="font-medium">{healthData.api?.responseTime || 0}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Requests/min:</span>
              <span className="font-medium">{healthData.api?.requestsPerMinute || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Error Rate:</span>
              <span className="font-medium">{(healthData.api?.errorRate || 0).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* WebSocket */}
        <div className={`card p-4 border-2 ${getStatusColor(healthData.websocket?.status)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              <h3 className="font-semibold">WebSocket</h3>
            </div>
            {getStatusIcon(healthData.websocket?.status)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Connected:</span>
              <span className="font-medium">{healthData.websocket?.connectedClients || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Messages/sec:</span>
              <span className="font-medium">{healthData.websocket?.messagesPerSecond || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Latency:</span>
              <span className="font-medium">{healthData.websocket?.latency || 0}ms</span>
            </div>
          </div>
        </div>

        {/* Redis Cache */}
        <div className={`card p-4 border-2 ${getStatusColor(healthData.redis?.status)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <h3 className="font-semibold">Redis Cache</h3>
            </div>
            {getStatusIcon(healthData.redis?.status)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Memory Used:</span>
              <span className="font-medium">{healthData.redis?.memoryUsed || 0}MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hit Rate:</span>
              <span className="font-medium">{(healthData.redis?.hitRate || 0).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Keys:</span>
              <span className="font-medium">{healthData.redis?.keyCount || 0}</span>
            </div>
          </div>
        </div>

        {/* External APIs */}
        <div className={`card p-4 border-2 ${getStatusColor(healthData.external_apis?.status)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              <h3 className="font-semibold">External APIs</h3>
            </div>
            {getStatusIcon(healthData.external_apis?.status)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment API:</span>
              <span className="font-medium capitalize">{healthData.external_apis?.payment || 'unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SMS API:</span>
              <span className="font-medium capitalize">{healthData.external_apis?.sms || 'unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maps API:</span>
              <span className="font-medium capitalize">{healthData.external_apis?.maps || 'unknown'}</span>
            </div>
          </div>
        </div>

        {/* Background Jobs */}
        <div className={`card p-4 border-2 ${getStatusColor(healthData.background_jobs?.status)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <h3 className="font-semibold">Background Jobs</h3>
            </div>
            {getStatusIcon(healthData.background_jobs?.status)}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Running:</span>
              <span className="font-medium">{healthData.background_jobs?.running || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Failed:</span>
              <span className="font-medium">{healthData.background_jobs?.failed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium">{healthData.background_jobs?.completed || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-sidebar mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h4 className="font-medium text-sidebar mb-2">{metric.name}</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{metric.current}</span>
                    {metric.previous && getTrendIcon(metric.current, metric.previous)}
                  </div>
                </div>
                {metric.previous && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Previous:</span>
                    <span className="font-medium">{metric.previous}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Unit:</span>
                  <span className="font-medium">{metric.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      {healthData.recent_events && healthData.recent_events.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-sidebar mb-4">Recent Events</h3>
          <div className="space-y-3">
            {healthData.recent_events.slice(0, 5).map((event, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${
                  event.type === 'error' ? 'bg-red-100' :
                  event.type === 'warning' ? 'bg-yellow-100' :
                  event.type === 'info' ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  {event.type === 'error' ? <XCircle className="w-4 h-4 text-red-600" /> :
                   event.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-600" /> :
                   event.type === 'info' ? <CheckCircle className="w-4 h-4 text-blue-600" /> :
                   <Activity className="w-4 h-4 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sidebar">{event.message}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
