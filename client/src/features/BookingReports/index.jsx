import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Search, Download, Filter, User, Mail, Phone, Calendar, DollarSign, Users, TrendingUp, FileText, BarChart3, Eye } from 'lucide-react';

export default function BookingReports() {
  const [page, setPage] = useState(1);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedBooking, setExpandedBooking] = useState(null);

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
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

            {/* Summary Section */}
            <div className="bg-gradient-to-r from-primary/10 to-gold/10 border border-primary/20 rounded-lg p-6">
              <h3 className="font-bold text-sidebar text-lg mb-4">📊 Report Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase mb-2">Revenue Metrics</p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Total Revenue:</strong> <span className="text-primary font-black">{statsData.totalRevenue.toLocaleString()} ETB</span></p>
                    <p><strong>Avg per Booking:</strong> <span className="text-primary font-black">{(statsData.totalRevenue / (statsData.totalBookings || 1)).toFixed(0)} ETB</span></p>
                    <p><strong>Conversion Rate:</strong> <span className="text-primary font-black">{((statsData.paidBookings / statsData.totalBookings) * 100).toFixed(1)}%</span></p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase mb-2">Booking Status</p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Pending:</strong> <span className="text-yellow-600 font-bold">{statsData.totalBookings - statsData.paidBookings - statsData.cancelledBookings}</span></p>
                    <p><strong>Used:</strong> <span className="text-primary font-bold">{statsData.usedBookings}</span></p>
                    <p><strong>Cancelled:</strong> <span className="text-red-600 font-bold">{statsData.cancelledBookings}</span></p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase mb-2">Top Passengers</p>
                  <div className="space-y-1 text-sm">
                    {statsData.topPassengers && statsData.topPassengers.slice(0, 3).map((p, i) => (
                      <p key={i} className="flex justify-between">
                        <span>{p.passenger?.name}</span>
                        <span className="font-bold text-primary">{p.bookingCount} bookings</span>
                      </p>
                    ))}
                  </div>
                </div>
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
            <div className="space-y-0">
              {bookingsData.map(booking => (
                <div key={booking.id} className="border-b last:border-b-0">
                  {/* Booking Row */}
                  <div className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Booking ID</p>
                        <p className="font-black text-primary cursor-pointer hover:underline" onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}>
                          {booking.bookingRef}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Passenger</p>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-sidebar">{booking.passengerInfo?.name || 'Unknown'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Email</p>
                        <p className="text-sm text-gray-700 truncate">{booking.passengerInfo?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Phone</p>
                        <p className="text-sm text-gray-700">{booking.passengerInfo?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Route</p>
                        <p className="text-sm font-semibold text-sidebar">
                          {booking.schedule?.route?.origin} → {booking.schedule?.route?.destination}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Amount</p>
                        <p className="text-lg font-black text-primary">{booking.totalAmount} {booking.currency}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          booking.status === 'USED' ? 'bg-primary/10 text-primary' :
                          booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status}
                        </span>
                        <button 
                          onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                          className="text-gray-400 hover:text-primary transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedBooking === booking.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Booking Date</p>
                            <p className="text-sm font-semibold text-sidebar">{new Date(booking.createdAt).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Payment Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                              booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                              booking.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {booking.paymentStatus}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Payment Method</p>
                            <p className="text-sm font-semibold text-sidebar">{booking.paymentMethod || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Passenger Details</p>
                            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1 mt-1">
                              <p><strong>Email:</strong> {booking.passengerInfo?.email}</p>
                              <p><strong>Phone:</strong> {booking.passengerInfo?.phone}</p>
                              <p><strong>Member Since:</strong> {new Date(booking.passengerInfo?.registeredAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Passengers on This Booking</p>
                            {booking.passengers && booking.passengers.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {booking.passengers.map((p, i) => (
                                  <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                                    <p className="text-xs font-bold text-blue-900">Seat {p.seatNumber}</p>
                                    <p className="text-xs text-blue-700">{p.name || 'Passenger'}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">No passenger details available</p>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Schedule Information</p>
                          <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                            <p><strong>Departure:</strong> {booking.schedule?.departureTime ? new Date(booking.schedule.departureTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>Fare per Seat:</strong> {booking.schedule?.fare} ETB</p>
                            <p><strong>Route:</strong> {booking.schedule?.route?.origin} → {booking.schedule?.route?.destination}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
