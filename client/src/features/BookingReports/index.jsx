import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Search, Download, Filter, User, Mail, Phone, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';

export default function BookingReports() {
  const [page, setPage] = useState(1);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch all bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', page, searchEmail, searchPhone, status, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/booking-reports/all', {
        params: {
          page,
          limit: 50,
          searchEmail: searchEmail || undefined,
          searchPhone: searchPhone || undefined,
          status: status || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });
      return data.data;
    }
  });

  // Fetch statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['booking-stats'],
    queryFn: async () => {
      const { data } = await api.get('/booking-reports/statistics');
      return data.data;
    }
  });

  const handleExport = async () => {
    try {
      const { data } = await api.get('/booking-reports/export', {
        params: {
          status: status || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });
      
      const jsonStr = JSON.stringify(data.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success('Bookings exported successfully');
    } catch (err) {
      toast.error('Failed to export bookings');
    }
  };

  const handleReset = () => {
    setSearchEmail('');
    setSearchPhone('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-sidebar">Booking Reports</h1>
            <p className="text-gray-500 mt-1">Track and manage all ticket bookings with passenger identification</p>
          </div>
          <button 
            onClick={handleExport}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        {/* Statistics Cards */}
        {!statsLoading && statsData && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Total Bookings</p>
                  <p className="text-2xl font-black text-sidebar mt-2">{statsData.totalBookings}</p>
                </div>
                <Users className="w-8 h-8 text-primary/20" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Paid</p>
                  <p className="text-2xl font-black text-green-600 mt-2">{statsData.paidBookings}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-100" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Used</p>
                  <p className="text-2xl font-black text-primary mt-2">{statsData.usedBookings}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary/20" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Cancelled</p>
                  <p className="text-2xl font-black text-red-600 mt-2">{statsData.cancelledBookings}</p>
                </div>
                <Users className="w-8 h-8 text-red-100" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Revenue</p>
                  <p className="text-2xl font-black text-sidebar mt-2">{statsData.totalRevenue.toLocaleString()} ETB</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary/20" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 border border-gray-100 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sidebar">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Search Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email"
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="input pl-10 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Search Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search by phone..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="input pl-10 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input text-sm"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="USED">Used</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input pl-10 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input pl-10 text-sm"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button 
                onClick={handleReset}
                className="btn-secondary flex-1"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          {bookingsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading bookings...</div>
          ) : bookingsData && bookingsData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left font-bold text-gray-600">Booking Ref</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-600">Passenger Name</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-600">Email</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-600">Phone</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-600">Route</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-600">Passengers</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-600">Amount</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsData.map(booking => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-primary">{booking.bookingRef}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-sidebar">{booking.passengerInfo?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{booking.passengerInfo?.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{booking.passengerInfo?.phone || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold">
                          {booking.schedule?.route?.origin} → {booking.schedule?.route?.destination}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                          {booking.passengerCount} seat{booking.passengerCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-sidebar">{booking.totalAmount} {booking.currency}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          booking.status === 'USED' ? 'bg-primary/10 text-primary' :
                          booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No bookings found</div>
          )}
        </div>

        {/* Pagination */}
        {bookingsData && bookingsData.length > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-bold text-sidebar">
              Page {page}
            </span>
            <button 
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
