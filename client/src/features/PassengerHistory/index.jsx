// ✅ BOOKING REPORTS FEATURE - FULLY FUNCTIONAL
// Track who booked each ticket with passenger identification
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Search, User, Mail, Phone, Calendar, MapPin, DollarSign, CheckCircle, Clock, ArrowRight, AlertCircle } from 'lucide-react';

export default function PassengerHistory() {
  const [searchPassengerId, setSearchPassengerId] = useState('');
  const [selectedPassenger, setSelectedPassenger] = useState(null);

  // Fetch passenger booking history
  const { data: passengerData, isLoading, refetch } = useQuery({
    queryKey: ['passenger-history', searchPassengerId],
    queryFn: async () => {
      if (!searchPassengerId) return null;
      const { data } = await api.get(`/booking-reports/passenger/${searchPassengerId}`);
      return data.data;
    },
    enabled: !!searchPassengerId
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchPassengerId.trim()) {
      toast.error('Please enter a passenger ID');
      return;
    }
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-sidebar">Passenger History</h1>
          <p className="text-gray-500 mt-1">Track individual passenger booking history and behavior</p>
        </div>

        {/* Search Card */}
        <form onSubmit={handleSearch} className="bg-white rounded-lg p-6 border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-600 mb-2">Passenger ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Enter passenger UUID..."
                  value={searchPassengerId}
                  onChange={(e) => setSearchPassengerId(e.target.value)}
                  className="input pl-10 text-sm w-full"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button 
                type="submit"
                className="btn-primary w-full md:w-auto"
              >
                <Search className="w-4 h-4 inline mr-2" /> Search
              </button>
            </div>
          </div>
        </form>

        {/* Results */}
        {isLoading && (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            Loading passenger history...
          </div>
        )}

        {passengerData && (
          <div className="space-y-8">
            {/* Passenger Info Card */}
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-8 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black">{passengerData.passengerInfo?.name}</h2>
                    <p className="text-white/80 mt-2">Passenger Profile</p>
                  </div>
                  <User className="w-12 h-12 text-white/30" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sidebar">{passengerData.passengerInfo?.email}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sidebar">{passengerData.passengerInfo?.phone || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Member Since</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sidebar">
                      {new Date(passengerData.passengerInfo?.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Passenger ID</p>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-sidebar">{passengerData.passengerInfo?.id}</span>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Bookings</p>
                    <p className="text-2xl font-black text-sidebar">{passengerData.totalBookings}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Spent</p>
                    <p className="text-2xl font-black text-green-600">{passengerData.totalSpent.toLocaleString()} ETB</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Avg Spend</p>
                    <p className="text-2xl font-black text-blue-600">
                      {passengerData.totalBookings > 0 ? (passengerData.totalSpent / passengerData.totalBookings).toFixed(0) : 0} ETB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking History */}
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="font-black text-sidebar text-lg">Booking History</h3>
              </div>
              
              {passengerData.bookings && passengerData.bookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left font-bold text-gray-600">Booking Ref</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-600">Route</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-600">Departure</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-600">Passengers</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-600">Amount</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-600">Status</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-600">Booked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengerData.bookings.map(booking => (
                        <tr key={booking.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-primary">{booking.bookingRef}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="font-semibold text-sidebar">
                                {booking.route?.origin} → {booking.route?.destination}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(booking.departureTime).toLocaleDateString()} {new Date(booking.departureTime).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                              {booking.passengerCount} seat{booking.passengerCount !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-sidebar">{booking.totalAmount} ETB</td>
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
                          <td className="px-6 py-4 text-gray-600 text-xs">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No bookings found for this passenger
                </div>
              )}
            </div>
          </div>
        )}

        {!isLoading && !passengerData && searchPassengerId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-yellow-700 font-semibold">Passenger not found</p>
            <p className="text-yellow-600 text-sm mt-1">Check the passenger ID and try again</p>
          </div>
        )}

        {!searchPassengerId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <User className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-50" />
            <p className="text-blue-900 font-semibold text-lg">Enter a Passenger ID to view history</p>
            <p className="text-blue-700 text-sm mt-2">Use the search field above to look up a passenger's booking history</p>
          </div>
        )}
      </div>
    </div>
  );
}
