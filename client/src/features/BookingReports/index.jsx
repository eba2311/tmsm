import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Download, Filter, Eye, Printer, RefreshCw } from 'lucide-react';

export default function BookingReports() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    searchEmail: '',
    searchPhone: '',
    status: '',
    paymentMethod: '',
    paymentStatus: '',
    startDate: '',
    endDate: '',
  });
  const [expandedBooking, setExpandedBooking] = useState(null);

  // Fetch bookings
  const { data: bookingsData = { data: [], pagination: {} }, isLoading: bookingsLoading, refetch } = useQuery({
    queryKey: ['bookings', page, filters],
    queryFn: async () => {
      const { data } = await api.get('/booking-reports/all', {
        params: { page, limit: 100, ...filters }
      });
      return data;
    }
  });

  // Fetch summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['booking-summary', filters],
    queryFn: async () => {
      const { data } = await api.get('/booking-reports/summary', {
        params: filters
      });
      return data.data;
    }
  });

  const handleExport = async (format = 'json') => {
    try {
      const { data } = await api.get('/booking-reports/export', {
        params: { format, ...filters }
      });
      
      if (format === 'json') {
        const jsonStr = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
      toast.success('Data exported successfully');
    } catch (err) {
      toast.error('Failed to export');
    }
  };

  const handleReset = () => {
    setFilters({
      searchEmail: '', searchPhone: '', status: '', paymentMethod: '',
      paymentStatus: '', startDate: '', endDate: ''
    });
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-sidebar">All Bookings</h1>
            <p className="text-gray-500 mt-1">View all passengers and their booking information</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={() => handleExport('json')} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {!summaryLoading && summaryData && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">Total Bookings</p>
              <p className="text-2xl font-black text-sidebar mt-2">{summaryData.totalBookings}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">Paid</p>
              <p className="text-2xl font-black text-green-600 mt-2">{summaryData.paidBookings}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">Total Revenue</p>
              <p className="text-2xl font-black text-primary mt-2">{summaryData.totalRevenue?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">Total Passengers</p>
              <p className="text-2xl font-black text-blue-600 mt-2">{summaryData.totalPassengers}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">Cancelled</p>
              <p className="text-2xl font-black text-red-600 mt-2">{summaryData.cancelledBookings}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input type="email" value={filters.searchEmail} onChange={(e) => setFilters({...filters, searchEmail: e.target.value})}
              className="input text-sm" placeholder="Search by email" />
            <input type="tel" value={filters.searchPhone} onChange={(e) => setFilters({...filters, searchPhone: e.target.value})}
              className="input text-sm" placeholder="Search by phone" />
            <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="input text-sm">
              <option value="">All Booking Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="USED">Used</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select value={filters.paymentStatus} onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})} className="input text-sm">
              <option value="">All Payment Status</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
            <button onClick={handleReset} className="btn-secondary text-sm">Reset</button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          {bookingsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading bookings...</div>
          ) : bookingsData.data && bookingsData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left font-bold">Ticket #</th>
                    <th className="px-4 py-3 text-left font-bold">Passenger Name</th>
                    <th className="px-4 py-3 text-left font-bold">Phone</th>
                    <th className="px-4 py-3 text-left font-bold">Vehicle</th>
                    <th className="px-4 py-3 text-left font-bold">Seats</th>
                    <th className="px-4 py-3 text-left font-bold">Route</th>
                    <th className="px-4 py-3 text-left font-bold">Amount</th>
                    <th className="px-4 py-3 text-left font-bold">Status</th>
                    <th className="px-4 py-3 text-center font-bold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsData.data.map(booking => (
                    <tr key={booking.bookingId} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-primary">{booking.ticketNumber}</td>
                      <td className="px-4 py-3 font-semibold">{booking.passengerName}</td>
                      <td className="px-4 py-3 text-gray-600">{booking.passengerPhone}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{booking.vehicleName}</div>
                        <div className="text-xs text-gray-500">{booking.vehiclePlateNumber}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{booking.seatsBooked}</td>
                      <td className="px-4 py-3 text-sm">{booking.route}</td>
                      <td className="px-4 py-3 font-bold">{booking.amountPaid} {booking.currency}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          booking.bookingStatus === 'USED' ? 'bg-blue-100 text-blue-700' :
                          booking.bookingStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          booking.bookingStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.bookingStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setExpandedBooking(expandedBooking === booking.bookingId ? null : booking.bookingId)}
                          className="text-primary hover:text-primary/80">
                          <Eye className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No bookings found</div>
          )}

          {/* Expanded Details */}
          {expandedBooking && (
            <div className="border-t p-6 bg-gray-50">
              {(() => {
                const booking = bookingsData.data.find(b => b.bookingId === expandedBooking);
                if (!booking) return null;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                      <h4 className="font-bold text-sidebar mb-3">📋 Passenger Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {booking.passengerName}</p>
                        <p><strong>Email:</strong> {booking.passengerEmail}</p>
                        <p><strong>Phone:</strong> {booking.passengerPhone}</p>
                        <p><strong>ID:</strong> {booking.passengerId}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                      <h4 className="font-bold text-sidebar mb-3">🚌 Vehicle Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Vehicle:</strong> {booking.vehicleName}</p>
                        <p><strong>Plate Number:</strong> {booking.vehiclePlateNumber}</p>
                        <p><strong>Capacity:</strong> {booking.vehicleCapacity} seats</p>
                        <p><strong>Seats Booked:</strong> {booking.seatsBooked}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                      <h4 className="font-bold text-sidebar mb-3">🛣️ Route & Travel</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Route:</strong> {booking.route}</p>
                        <p><strong>Departure:</strong> {booking.travelDateFormatted}</p>
                        <p><strong>Booking Date:</strong> {booking.bookingDateFormatted}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                      <h4 className="font-bold text-sidebar mb-3">💰 Payment Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Amount:</strong> {booking.amountPaid} {booking.currency}</p>
                        <p><strong>Method:</strong> {booking.paymentMethod}</p>
                        <p><strong>Status:</strong> <span className={booking.paymentStatus === 'PAID' ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'}>{booking.paymentStatus}</span></p>
                        <p><strong>Transaction:</strong> {booking.transactionId}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                      <h4 className="font-bold text-sidebar mb-3">👨‍✈️ Driver Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Driver:</strong> {booking.driverName}</p>
                        <p><strong>Phone:</strong> {booking.driverPhone}</p>
                        <p><strong>License:</strong> {booking.driverLicense}</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                      <h4 className="font-bold text-sidebar mb-3">📊 Booking Status</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Status:</strong> <span className={`px-2 py-1 rounded font-bold ${
                          booking.bookingStatus === 'USED' ? 'bg-blue-100 text-blue-700' :
                          booking.bookingStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          booking.bookingStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{booking.bookingStatus}</span></p>
                        <p><strong>Ticket:</strong> {booking.ticketNumber}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Pagination */}
        {bookingsData.pagination && bookingsData.pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary">Previous</button>
            <span className="flex items-center px-4">{page} / {bookingsData.pagination.pages}</span>
            <button onClick={() => setPage(Math.min(bookingsData.pagination.pages, page + 1))} disabled={page === bookingsData.pagination.pages} className="btn-secondary">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
