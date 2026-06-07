import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Search, Download, Filter, User, Mail, Phone, Calendar, DollarSign, Users, TrendingUp, FileText, BarChart3, Eye, Printer } from 'lucide-react';

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
    routeId: '',
    vehicleId: '',
    driverId: ''
  });
  const [expandedBooking, setExpandedBooking] = useState(null);

  // Fetch bookings
  const { data: bookingsData = { data: [], pagination: {} }, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', page, filters],
    queryFn: async () => {
      const { data } = await api.get('/booking-reports/all', {
        params: { page, limit: 50, ...filters }
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
      paymentStatus: '', startDate: '', endDate: '', routeId: '', vehicleId: '', driverId: ''
    });
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-sidebar">Ticket Reports</h1>
            <p className="text-gray-500 mt-1">Complete booking information with all passenger and payment details</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('json')} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" /> Export JSON
            </button>
            <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {!summaryLoading && summaryData && (
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Bookings</p>
                <p className="text-2xl font-black text-sidebar mt-2">{summaryData.totalBookings}</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Revenue</p>
                <p className="text-2xl font-black text-green-600 mt-2">{summaryData.totalRevenue.toLocaleString()} ETB</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase">Paid Bookings</p>
                <p className="text-2xl font-black text-primary mt-2">{summaryData.paidBookings}</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase">Total Passengers</p>
                <p className="text-2xl font-black text-blue-600 mt-2">{summaryData.totalPassengers}</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase">Pending</p>
                <p className="text-2xl font-black text-yellow-600 mt-2">{summaryData.pendingBookings}</p>
              </div>
            </div>

            {/* Revenue by Payment Method */}
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <h3 className="font-bold text-sidebar mb-4">Revenue by Payment Method</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(summaryData.revenueByPaymentMethod || {}).map(([method, amount]) => (
                  <div key={method} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold text-gray-600">{method}</p>
                    <p className="text-lg font-black text-primary mt-1">{amount.toLocaleString()} ETB</p>
                  </div>
                ))}
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <input type="email" placeholder="Search email..." value={filters.searchEmail}
              onChange={(e) => setFilters({...filters, searchEmail: e.target.value})}
              className="input text-sm" />
            <input type="text" placeholder="Search phone..." value={filters.searchPhone}
              onChange={(e) => setFilters({...filters, searchPhone: e.target.value})}
              className="input text-sm" />
            <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="input text-sm">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="USED">Used</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select value={filters.paymentStatus} onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})} className="input text-sm">
              <option value="">All Payment Status</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
            </select>
            <select value={filters.paymentMethod} onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})} className="input text-sm">
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="TELEBIRR">Telebirr</option>
              <option value="CBE_BIRR">CBE Birr</option>
              <option value="CARD">Card</option>
            </select>
            <input type="date" value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="input text-sm" placeholder="Start date" />
            <input type="date" value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="input text-sm" placeholder="End date" />
            <button onClick={handleReset} className="btn-secondary text-sm">Reset Filters</button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          {bookingsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading bookings...</div>
          ) : bookingsData.data && bookingsData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Ticket No</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Passenger</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Route</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Vehicle</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Seats</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Amount</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Payment</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsData.data.map(booking => (
                    <tr key={booking.bookingId} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-primary">{booking.ticketNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-sidebar">{booking.passengerName}</div>
                        <div className="text-xs text-gray-500">{booking.passengerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">{booking.route}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>{booking.vehicleName}</div>
                        <div className="text-xs text-gray-500">{booking.vehiclePlateNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">{booking.seatsBooked}</td>
                      <td className="px-4 py-3 font-black text-sidebar">{booking.amountPaid} {booking.currency}</td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold">{booking.paymentMethod}</div>
                        <div className={`${booking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {booking.paymentStatus}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          booking.bookingStatus === 'USED' ? 'bg-primary/10 text-primary' :
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
                    <div className="space-y-3">
                      <h4 className="font-bold text-sidebar">Booking Details</h4>
                      <div className="space-y-2 text-sm bg-white p-3 rounded-lg">
                        <p><strong>Booking ID:</strong> {booking.bookingId}</p>
                        <p><strong>Ticket Number:</strong> {booking.ticketNumber}</p>
                        <p><strong>Booking Date:</strong> {booking.bookingDateFormatted}</p>
                        <p><strong>Travel Date:</strong> {booking.travelDateFormatted}</p>
                        <p><strong>Created By:</strong> {booking.createdBy}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-sidebar">Passenger & Payment</h4>
                      <div className="space-y-2 text-sm bg-white p-3 rounded-lg">
                        <p><strong>Passenger:</strong> {booking.passengerName}</p>
                        <p><strong>Phone:</strong> {booking.passengerPhone}</p>
                        <p><strong>Email:</strong> {booking.passengerEmail}</p>
                        <p><strong>Amount:</strong> {booking.amountPaid} {booking.currency}</p>
                        <p><strong>Payment Method:</strong> {booking.paymentMethod}</p>
                        <p><strong>Transaction ID:</strong> {booking.transactionId}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-sidebar">Vehicle & Route</h4>
                      <div className="space-y-2 text-sm bg-white p-3 rounded-lg">
                        <p><strong>Vehicle:</strong> {booking.vehicleName}</p>
                        <p><strong>Plate Number:</strong> {booking.vehiclePlateNumber}</p>
                        <p><strong>Capacity:</strong> {booking.vehicleCapacity}</p>
                        <p><strong>Route:</strong> {booking.route}</p>
                        <p><strong>Seats Booked:</strong> {booking.seatsBooked}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold text-sidebar">Driver Info</h4>
                      <div className="space-y-2 text-sm bg-white p-3 rounded-lg">
                        <p><strong>Driver:</strong> {booking.driverName}</p>
                        <p><strong>Phone:</strong> {booking.driverPhone}</p>
                        <p><strong>License:</strong> {booking.driverLicense}</p>
                        <p><strong>Booking Status:</strong> {booking.bookingStatus}</p>
                        <p><strong>Payment Status:</strong> {booking.paymentStatus}</p>
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
          <div className="mt-8 flex justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-50">
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-bold text-sidebar">
              Page {page} of {bookingsData.pagination.pages}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === bookingsData.pagination.pages} className="btn-secondary disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
