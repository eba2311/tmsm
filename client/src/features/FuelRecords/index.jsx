import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Fuel, Plus, Search, Filter, Download, Calendar, MapPin, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

export default function FuelRecords() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    date: new Date().toISOString().split('T')[0],
    fuelType: 'DIESEL',
    quantity: '',
    unit: 'LITERS',
    costPerUnit: '',
    odometerReading: '',
    previousOdometer: '',
    station: '',
    paymentMethod: 'CASH',
    receiptNumber: '',
    notes: '',
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['fuel-records'],
    queryFn: async () => {
      const { data } = await api.get('/fuel-records');
      return data.data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['fuel-stats'],
    queryFn: async () => {
      const { data } = await api.get('/fuel-records/summary/overview');
      return data.data || {};
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles');
      return data.data || [];
    },
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data } = await api.get('/drivers');
      return data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: response } = await api.post('/fuel-records', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fuel-records']);
      queryClient.invalidateQueries(['fuel-stats']);
      setShowAddForm(false);
      setFormData({
        vehicleId: '',
        driverId: '',
        date: new Date().toISOString().split('T')[0],
        fuelType: 'DIESEL',
        quantity: '',
        unit: 'LITERS',
        costPerUnit: '',
        odometerReading: '',
        previousOdometer: '',
        station: '',
        paymentMethod: 'CASH',
        receiptNumber: '',
        notes: '',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      vehicleId: formData.vehicleId,
      driverId: formData.driverId || null,
      date: formData.date,
      fuelType: formData.fuelType,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      costPerUnit: Number(formData.costPerUnit),
      odometerReading: Number(formData.odometerReading),
      previousOdometer: formData.previousOdometer ? Number(formData.previousOdometer) : null,
      station: formData.station,
      paymentMethod: formData.paymentMethod,
      receiptNumber: formData.receiptNumber,
      notes: formData.notes,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Fuel Records</h1>
        <p className="text-gray-600">Track fuel consumption and costs for your fleet</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Quantity</span>
            <Fuel className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.summary?.totalQuantity?.toFixed(2) || 0} L</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Cost</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">ETB {stats?.summary?.totalCost?.toFixed(2) || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Efficiency</span>
            <TrendingDown className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.summary?.avgEfficiency?.toFixed(2) || 0} km/L</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Records</span>
            <Calendar className="w-4 h-4 text-gold" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.summary?.recordCount || 0}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              className="input pl-9 py-2 w-64"
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Fuel Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} - {v.type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="LPG">LPG</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (L)</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="input"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit (ETB)</label>
                  <input
                    type="number"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                    className="input"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer Reading (km)</label>
                  <input
                    type="number"
                    value={formData.odometerReading}
                    onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                    className="input"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Odometer (km)</label>
                  <input
                    type="number"
                    value={formData.previousOdometer}
                    onChange={(e) => setFormData({ ...formData, previousOdometer: e.target.value })}
                    className="input"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                  <input
                    type="text"
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="input"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="CREDIT">Credit</option>
                    <option value="COMPANY_ACCOUNT">Company Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                <input
                  type="text"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows="3"
                  maxLength="500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Date</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Vehicle</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Driver</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Fuel Type</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Quantity</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Cost</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Efficiency</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Station</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-500">No fuel records found</td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-gray-900">
                    {record.vehicle?.plateNumber} - {record.vehicle?.type}
                  </td>
                  <td className="p-4 text-sm text-gray-900">
                    {record.driver?.name || '-'}
                  </td>
                  <td className="p-4 text-sm text-gray-900">
                    {record.fuelType}
                  </td>
                  <td className="p-4 text-sm text-gray-900">
                    {record.quantity} {record.unit}
                  </td>
                  <td className="p-4 text-sm text-gray-900">
                    ETB {record.totalCost?.toFixed(2)}
                  </td>
                  <td className="p-4 text-sm text-gray-900">
                    {record.fuelEfficiency?.toFixed(2) || '-'} km/L
                  </td>
                  <td className="p-4 text-sm text-gray-900">
                    {record.station || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
