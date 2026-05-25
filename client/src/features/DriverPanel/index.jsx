import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { 
  Bus, MapPin, Clock, Calendar, 
  CheckCircle, AlertTriangle, Navigation,
  MessageSquare, User, TrendingUp, History
} from 'lucide-react';
import { format } from 'date-fns';

export default function DriverPanel() {
  const { data: myTrips = [], isLoading } = useQuery({
    queryKey: ['driver-trips'],
    queryFn: async () => (await api.get('/driver/trips')).data.data || [],
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['driver-stats'],
    queryFn: async () => (await api.get('/driver/stats')).data.data || {},
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-sidebar">Driver Dashboard</h1>
          <p className="text-gray-500 font-medium">Welcome back! Here's your schedule for today.</p>
        </div>
        <div className="flex items-center gap-3 bg-etgreen/10 px-4 py-2 rounded-2xl border border-etgreen/20">
          <div className="w-2 h-2 rounded-full bg-etgreen animate-pulse" />
          <span className="text-xs font-bold text-etgreen">ON DUTY</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-l-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Bus className="w-6 h-6 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This Month</span>
          </div>
          <p className="text-sm font-medium text-gray-500">Total Trips</p>
          <p className="text-3xl font-black text-sidebar">{stats.totalTrips || 0}</p>
        </div>
        <div className="card p-6 border-l-4 border-l-etgreen">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-etgreen/10 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-etgreen" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Performance</span>
          </div>
          <p className="text-sm font-medium text-gray-500">Avg Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-black text-sidebar">{stats.avgRating || '4.8'}</p>
            <div className="flex text-gold">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(stats.avgRating || 4) ? 'text-gold' : 'text-gray-200'}>★</span>
              ))}
            </div>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-l-gold">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-gold/10 rounded-2xl">
              <Clock className="w-6 h-6 text-gold-dark" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">On-Time</span>
          </div>
          <p className="text-sm font-medium text-gray-500">Arrival Rate</p>
          <p className="text-3xl font-black text-sidebar">{stats.onTimeRate || '96'}%</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Trips */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-sidebar flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Upcoming Trips
            </h2>
            <button className="text-xs font-bold text-primary hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {myTrips.length === 0 ? (
              <div className="card p-12 text-center text-gray-400 border-dashed">
                <Navigation className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No trips scheduled for today.</p>
              </div>
            ) : (
              myTrips.map((trip) => (
                <div key={trip._id} className="card p-6 hover:shadow-xl transition-all group">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-sidebar flex items-center justify-center text-white">
                        <Bus className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{trip.route?.name}</p>
                        <h3 className="text-lg font-black text-sidebar">{trip.vehicle?.plateNumber}</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Departure</p>
                      <p className="text-lg font-black text-sidebar">{format(new Date(trip.departureTime), 'HH:mm')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 py-4 border-y border-gray-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold text-sidebar">Arba Minch Terminal</span>
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-gray-200 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                        <Navigation className="w-4 h-4 text-primary rotate-90" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-etgreen" />
                      <span className="text-sm font-bold text-sidebar">{trip.route?.destination || 'Addis Ababa'}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-gray-500">32 Passengers</span>
                    </div>
                    <button className="btn-primary !rounded-xl flex items-center gap-2">
                      Start Trip <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Features */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="font-bold text-sidebar mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all group">
                <AlertTriangle className="w-6 h-6 mb-2 text-gray-400 group-hover:text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Incident</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all group">
                <MessageSquare className="w-6 h-6 mb-2 text-gray-400 group-hover:text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Support</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all group">
                <History className="w-6 h-6 mb-2 text-gray-400 group-hover:text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all group">
                <User className="w-6 h-6 mb-2 text-gray-400 group-hover:text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
              </button>
            </div>
          </div>

          {/* Training/Tips */}
          <div className="card p-6 bg-sidebar text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <h3 className="font-bold text-lg mb-2">Safety Tip of the Day</h3>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              "Maintain safe distance during heavy rain on the Arba Minch - Sodo mountain roads."
            </p>
            <button className="text-gold font-bold text-xs uppercase tracking-widest hover:underline">Read Safety Manual</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldCheck(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
