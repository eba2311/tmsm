import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Smartphone, QrCode, Download, Shield, Users, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState('overview');
  const [appStats, setAppStats] = useState({});

  const { data: mobileUsers = [], isLoading } = useQuery({
    queryKey: ['mobile-users'],
    queryFn: async () => {
      const { data } = await api.get('/mobile/users');
      return data.data || [];
    },
  });

  const { data: appUsage = [] } = useQuery({
    queryKey: ['mobile-usage'],
    queryFn: async () => {
      const { data } = await api.get('/mobile/usage');
      return data.data || [];
    },
  });

  useEffect(() => {
    // Calculate app statistics
    const stats = {
      totalUsers: mobileUsers.length,
      activeUsers: mobileUsers.filter(u => u.lastActive && new Date(u.lastActive) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
      androidUsers: mobileUsers.filter(u => u.platform === 'android').length,
      iosUsers: mobileUsers.filter(u => u.platform === 'ios').length,
      avgSessionDuration: appUsage.length > 0 ? 
        appUsage.reduce((sum, u) => sum + (u.avgSessionDuration || 0), 0) / appUsage.length : 0,
      totalSessions: appUsage.reduce((sum, u) => sum + (u.totalSessions || 0), 0),
    };
    setAppStats(stats);
  }, [mobileUsers, appUsage]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Smartphone },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: MapPin },
    { id: 'settings', label: 'App Settings', icon: Shield },
  ];

  const downloadQRCode = () => {
    // Generate QR code for app download
    const qrData = {
      url: window.location.origin + '/mobile-app',
      platform: 'universal',
    };
    
    const blob = new Blob([JSON.stringify(qrData)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'app-qr.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateAPIDocumentation = () => {
    const apiDoc = {
      version: '1.0.0',
      baseUrl: window.location.origin + '/api/v1',
      endpoints: {
        auth: {
          login: 'POST /auth/login',
          logout: 'POST /auth/logout',
          refresh: 'POST /auth/refresh',
          verify: 'POST /auth/verify',
        },
        trips: {
          list: 'GET /trips',
          details: 'GET /trips/:id',
          start: 'POST /trips/start',
          end: 'POST /trips/end',
        },
        locations: {
          update: 'POST /locations/update',
          history: 'GET /locations/history',
        },
        notifications: {
          list: 'GET /notifications',
          markRead: 'PATCH /notifications/:id/read',
        },
      },
      authentication: 'Bearer Token required',
      rateLimit: '100 requests per minute',
    };

    const blob = new Blob([JSON.stringify(apiDoc, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mobile-api-documentation.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-primary" />
            Mobile App Management
          </h1>
          <p className="page-subtitle">Manage mobile application and user access</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadQRCode}
            className="btn-secondary flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Download QR
          </button>
          <button
            onClick={generateAPIDocumentation}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            API Docs
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-sidebar">{appStats.totalUsers || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Registered users</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-sidebar">{appStats.activeUsers || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-sidebar">{appStats.totalSessions || 0}</p>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Avg Session</p>
              <p className="text-2xl font-bold text-sidebar">{(appStats.avgSessionDuration || 0).toFixed(1)}m</p>
              <p className="text-xs text-gray-400 mt-1">Duration</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Smartphone className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Platform Distribution */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-sidebar mb-4">Platform Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{appStats.androidUsers || 0}</div>
                    <p className="text-sm text-gray-600">Android Users</p>
                    <div className="mt-2 bg-blue-100 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${appStats.totalUsers > 0 ? (appStats.androidUsers / appStats.totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{appStats.iosUsers || 0}</div>
                    <p className="text-sm text-gray-600">iOS Users</p>
                    <div className="mt-2 bg-green-100 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${appStats.totalUsers > 0 ? (appStats.iosUsers / appStats.totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* App Features */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-sidebar mb-4">Mobile App Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Real-time Tracking', description: 'Live GPS tracking and route monitoring', status: 'active' },
                    { title: 'Trip Management', description: 'Start, end, and manage trips', status: 'active' },
                    { title: 'Offline Mode', description: 'Works without internet connection', status: 'active' },
                    { title: 'Push Notifications', description: 'Instant alerts and updates', status: 'active' },
                    { title: 'Digital Tickets', description: 'QR code based ticketing', status: 'beta' },
                    { title: 'Voice Commands', description: 'Hands-free operation', status: 'planned' },
                  ].map((feature, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sidebar">{feature.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          feature.status === 'active' ? 'bg-green-100 text-green-800' :
                          feature.status === 'beta' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {feature.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-sidebar mb-4">User Management</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Platform</th>
                      <th className="text-left py-3 px-4">Version</th>
                      <th className="text-left py-3 px-4">Last Active</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mobileUsers.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded ${
                            user.platform === 'android' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.platform?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">{user.appVersion}</td>
                        <td className="py-3 px-4">
                          {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-sidebar mb-4">Usage Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {appUsage.slice(0, 4).map((usage, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium text-sidebar mb-2">{usage.feature}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Daily Users</span>
                          <span className="font-medium">{usage.dailyUsers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Avg Usage</span>
                          <span className="font-medium">{usage.avgUsage} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Crash Rate</span>
                          <span className="font-medium text-red-600">{usage.crashRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-sidebar mb-4">App Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      App Version
                    </label>
                    <input
                      type="text"
                      defaultValue="2.1.0"
                      className="input"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Supported Version
                    </label>
                    <input
                      type="text"
                      defaultValue="1.5.0"
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Force Update
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Mode
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      When enabled, users will see a maintenance message
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-sidebar mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      defaultValue="30"
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Failed Attempts
                    </label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lockout Duration (minutes)
                    </label>
                    <input
                      type="number"
                      defaultValue="15"
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
