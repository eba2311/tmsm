import api from '../lib/axios';

export const analyticsService = {
  // Driver Analytics
  getDriverAnalytics: async (params = {}) => {
    const { data } = await api.get('/analytics/drivers', { params });
    return data;
  },

  getTopPerformers: async () => {
    const { data } = await api.get('/analytics/drivers/top-performers');
    return data;
  },

  getDriverTrends: async (params = {}) => {
    const { data } = await api.get('/analytics/drivers/trends', { params });
    return data;
  },

  getDriverDetails: async (driverId) => {
    const { data } = await api.get(`/analytics/drivers/${driverId}`);
    return data;
  },

  // Fuel Management
  getFuelConsumption: async (params = {}) => {
    const { data } = await api.get('/fuel/consumption', { params });
    return data;
  },

  getFuelAlerts: async () => {
    const { data } = await api.get('/fuel/alerts');
    return data;
  },

  getFuelCostAnalysis: async (params = {}) => {
    const { data } = await api.get('/fuel/cost-analysis', { params });
    return data;
  },

  addFuelRecord: async (record) => {
    const { data } = await api.post('/fuel/records', record);
    return data;
  },

  updateFuelRecord: async (id, record) => {
    const { data } = await api.put(`/fuel/records/${id}`, record);
    return data;
  },

  deleteFuelRecord: async (id) => {
    const { data } = await api.delete(`/fuel/records/${id}`);
    return data;
  },

  // Maintenance
  getMaintenanceTasks: async (params = {}) => {
    const { data } = await api.get('/maintenance/tasks', { params });
    return data;
  },

  getMaintenanceHistory: async (params = {}) => {
    const { data } = await api.get('/maintenance/history', { params });
    return data;
  },

  getUpcomingMaintenance: async () => {
    const { data } = await api.get('/maintenance/upcoming');
    return data;
  },

  createMaintenanceTask: async (task) => {
    const { data } = await api.post('/maintenance/tasks', task);
    return data;
  },

  updateMaintenanceTask: async (id, updates) => {
    const { data } = await api.put(`/maintenance/tasks/${id}`, updates);
    return data;
  },

  updateTaskStatus: async (id, status) => {
    const { data } = await api.patch(`/maintenance/tasks/${id}/status`, { status });
    return data;
  },

  deleteMaintenanceTask: async (id) => {
    const { data } = await api.delete(`/maintenance/tasks/${id}`);
    return data;
  },

  // Passenger Capacity
  getRealTimeCapacity: async (params = {}) => {
    const { data } = await api.get('/capacity/realtime', { params });
    return data;
  },

  getCapacityTrends: async (params = {}) => {
    const { data } = await api.get('/capacity/trends', { params });
    return data;
  },

  getCapacityAlerts: async () => {
    const { data } = await api.get('/capacity/alerts');
    return data;
  },

  getRouteCapacity: async (routeId, params = {}) => {
    const { data } = await api.get(`/capacity/routes/${routeId}`, { params });
    return data;
  },

  // Reports
  getPerformanceReport: async (params = {}) => {
    const { data } = await api.get('/reports/performance', { params });
    return data;
  },

  getUtilizationReport: async (params = {}) => {
    const { data } = await api.get('/reports/utilization', { params });
    return data;
  },

  getCostReport: async (params = {}) => {
    const { data } = await api.get('/reports/cost', { params });
    return data;
  },

  exportReport: async (type, params = {}) => {
    const { data } = await api.get(`/reports/export/${type}`, { 
      params,
      responseType: 'blob'
    });
    return data;
  }
};
