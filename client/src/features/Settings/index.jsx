import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Settings, Bell, Shield, Database, Palette, Globe, Users, Bus, Fuel, Wrench, Save, RotateCcw } from 'lucide-react';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const qc = useQueryClient();

  const { data: systemSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data.data || {};
    },
  });

  const { data: userPreferences } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const { data } = await api.get('/users/preferences');
      return data.data || {};
    },
  });

  const updateSettings = useMutation({
    mutationFn: (newSettings) => api.put('/settings', newSettings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setHasChanges(false);
    },
  });

  const updatePreferences = useMutation({
    mutationFn: (preferences) => api.put('/users/preferences', preferences),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-preferences'] });
      setHasChanges(false);
    },
  });

  useEffect(() => {
    if (systemSettings) {
      setSettings(systemSettings);
    }
  }, [systemSettings]);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings.mutate(settings);
  };

  const handleReset = () => {
    setSettings(systemSettings);
    setHasChanges(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'vehicles', label: 'Vehicles', icon: Bus },
    { id: 'fuel', label: 'Fuel', icon: Fuel },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Backup', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="section-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            System Settings
          </h1>
          <p className="page-subtitle">Configure system parameters and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateSettings.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
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

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold text-sidebar mb-4">General Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Name
                  </label>
                  <input
                    type="text"
                    value={settings.general?.systemName || ''}
                    onChange={(e) => handleSettingChange('general', 'systemName', e.target.value)}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Language
                  </label>
                  <select
                    value={settings.general?.defaultLanguage || 'en'}
                    onChange={(e) => handleSettingChange('general', 'defaultLanguage', e.target.value)}
                    className="input"
                  >
                    <option value="en">English</option>
                    <option value="am">አማርኛ</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.general?.timezone || 'Africa/Addis_Ababa'}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                    className="input"
                  >
                    <option value="Africa/Addis_Ababa">Africa/Addis_Ababa</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.general?.currency || 'ETB'}
                    onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                    className="input"
                  >
                    <option value="ETB">Ethiopian Birr (ETB)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold text-sidebar mb-4">Notification Settings</h3>
              
              <div className="space-y-4">
                {[
                  { key: 'fuelAlerts', label: 'Fuel Alerts', description: 'Notify when fuel consumption is abnormal' },
                  { key: 'maintenanceDue', label: 'Maintenance Due', description: 'Notify when maintenance is scheduled or overdue' },
                  { key: 'overcrowding', label: 'Overcrowding Alerts', description: 'Notify when vehicles are overcrowded' },
                  { key: 'driverPerformance', label: 'Driver Performance', description: 'Weekly performance summaries' },
                  { key: 'systemUpdates', label: 'System Updates', description: 'Notify about system updates and maintenance' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-sidebar">{setting.label}</h4>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications?.[setting.key] || false}
                        onChange={(e) => handleSettingChange('notifications', setting.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold text-sidebar mb-4">Vehicle Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Vehicle Capacity
                  </label>
                  <input
                    type="number"
                    value={settings.vehicles?.defaultCapacity || ''}
                    onChange={(e) => handleSettingChange('vehicles', 'defaultCapacity', parseInt(e.target.value))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Interval (km)
                  </label>
                  <input
                    type="number"
                    value={settings.vehicles?.maintenanceInterval || ''}
                    onChange={(e) => handleSettingChange('vehicles', 'maintenanceInterval', parseInt(e.target.value))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Efficiency Threshold (km/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.vehicles?.fuelEfficiencyThreshold || ''}
                    onChange={(e) => handleSettingChange('vehicles', 'fuelEfficiencyThreshold', parseFloat(e.target.value))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Speed (km/h)
                  </label>
                  <input
                    type="number"
                    value={settings.vehicles?.maxSpeed || ''}
                    onChange={(e) => handleSettingChange('vehicles', 'maxSpeed', parseInt(e.target.value))}
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fuel' && (
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold text-sidebar mb-4">Fuel Management Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Price per Liter (ETB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.fuel?.pricePerLiter || ''}
                    onChange={(e) => handleSettingChange('fuel', 'pricePerLiter', parseFloat(e.target.value))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Fuel Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={settings.fuel?.lowFuelThreshold || ''}
                    onChange={(e) => handleSettingChange('fuel', 'lowFuelThreshold', parseInt(e.target.value))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Abnormal Consumption Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={settings.fuel?.abnormalConsumptionThreshold || ''}
                    onChange={(e) => handleSettingChange('fuel', 'abnormalConsumptionThreshold', parseInt(e.target.value))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Report Frequency
                  </label>
                  <select
                    value={settings.fuel?.reportFrequency || 'daily'}
                    onChange={(e) => handleSettingChange('fuel', 'reportFrequency', e.target.value)}
                    className="input"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold text-sidebar mb-4">Maintenance Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Maintenance Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={settings.maintenance?.defaultDuration || ''}
                    onChange={(e) => handleSettingChange('maintenance', 'defaultDuration', parseInt(e.target.value))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Notice Days
                  </label>
                  <input
                    type="number"
                    value={settings.maintenance?.advanceNoticeDays || ''}
                    onChange={(e) => handleSettingChange('maintenance', 'advanceNoticeDays', parseInt(e.target.value))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-schedule Maintenance
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenance?.autoSchedule || false}
                      onChange={(e) => handleSettingChange('maintenance', 'autoSchedule', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Types
                  </label>
                  <textarea
                    value={settings.maintenance?.types?.join('\n') || ''}
                    onChange={(e) => handleSettingChange('maintenance', 'types', e.target.value.split('\n').filter(Boolean))}
                    className="input"
                    rows={4}
                    placeholder="Oil Change&#10;Tire Rotation&#10;Brake Inspection"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold text-sidebar mb-4">Appearance Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={settings.appearance?.theme || 'light'}
                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                    className="input"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={settings.appearance?.primaryColor || '#1B4F8A'}
                    onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                    className="input h-10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compact Mode
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.appearance?.compactMode || false}
                      onChange={(e) => handleSettingChange('appearance', 'compactMode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Show Animations
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.appearance?.animations !== false}
                      onChange={(e) => handleSettingChange('appearance', 'animations', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold text-sidebar mb-4">Data & Backup Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-sidebar mb-3">Automatic Backup</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enable Automatic Backup
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.data?.autoBackup || false}
                          onChange={(e) => handleSettingChange('data', 'autoBackup', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Backup Frequency
                      </label>
                      <select
                        value={settings.data?.backupFrequency || 'daily'}
                        onChange={(e) => handleSettingChange('data', 'backupFrequency', e.target.value)}
                        className="input"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sidebar mb-3">Data Retention</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GPS Data Retention (days)
                      </label>
                      <input
                        type="number"
                        value={settings.data?.gpsRetentionDays || ''}
                        onChange={(e) => handleSettingChange('data', 'gpsRetentionDays', parseInt(e.target.value))}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Log Retention (days)
                      </label>
                      <input
                        type="number"
                        value={settings.data?.logRetentionDays || ''}
                        onChange={(e) => handleSettingChange('data', 'logRetentionDays', parseInt(e.target.value))}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sidebar mb-3">Export Options</h4>
                  <div className="flex gap-3">
                    <button className="btn-secondary">
                      Export All Data
                    </button>
                    <button className="btn-secondary">
                      Export Settings
                    </button>
                    <button className="btn-secondary">
                      Create Backup
                    </button>
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
