import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { 
  Bus, MapPin, Calendar, Users, Search, 
  ArrowRight, Shield, Clock, Star, Phone,
  Facebook, Twitter, Instagram, Mail
} from 'lucide-react';
import { format } from 'date-fns';

export default function PassengerPortal() {
  const [search, setSearch] = useState({ from: '', to: '', date: format(new Date(), 'yyyy-MM-dd') });
  const navigate = useNavigate();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['portal-schedules', search],
    queryFn: async () => {
      const { data } = await api.get('/schedules', { params: search });
      return data.data || [];
    },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Dabub Connect" className="w-10 h-10 rounded-xl" />
              <div>
                <h1 className="text-xl font-black text-sidebar tracking-tight">DABUB CONNECT</h1>
                <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Passenger Portal</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-bold text-sidebar hover:text-primary transition-colors">Search</a>
              <a href="#" className="text-sm font-bold text-sidebar hover:text-primary transition-colors">Routes</a>
              <a href="#" className="text-sm font-bold text-sidebar hover:text-primary transition-colors">Support</a>
              <button 
                onClick={() => navigate('/login')}
                className="btn-primary !rounded-full px-8"
              >
                Agent Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-white" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-sidebar mb-6 leading-tight">
            Connecting Arba Minch <br /> 
            <span className="text-primary">to the rest of Ethiopia.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12">
            Safe, reliable, and comfortable intercity travel. Book your tickets online and enjoy a seamless journey.
          </p>

          {/* Search Card */}
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-4 md:p-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-left space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">From</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <input 
                    type="text" 
                    placeholder="Arba Minch" 
                    className="input pl-10 h-14 bg-gray-50 border-transparent focus:bg-white"
                  />
                </div>
              </div>
              <div className="text-left space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <input 
                    type="text" 
                    placeholder="Addis Ababa" 
                    className="input pl-10 h-14 bg-gray-50 border-transparent focus:bg-white"
                  />
                </div>
              </div>
              <div className="text-left space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <input 
                    type="date" 
                    className="input pl-10 h-14 bg-gray-50 border-transparent focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button className="btn-primary w-full h-14 !rounded-2xl text-lg flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" /> Search Buses
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Routes */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-black text-sidebar">Popular Routes</h2>
              <p className="text-gray-500 mt-2">Daily departures from Arba Minch Terminal</p>
            </div>
            <button className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { from: 'Arba Minch', to: 'Addis Ababa', price: '850', duration: '8h 30m', image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800' },
              { from: 'Arba Minch', to: 'Hawassa', price: '450', duration: '4h 15m', image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=800' },
              { from: 'Arba Minch', to: 'Jinka', price: '600', duration: '5h 45m', image: 'https://images.unsplash.com/photo-1562620644-6564502580a8?auto=format&fit=crop&q=80&w=800' },
            ].map((route, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="relative h-64 rounded-3xl overflow-hidden mb-6">
                  <img src={route.image} alt={route.to} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-primary">
                    Daily Service
                  </div>
                </div>
                <h3 className="text-xl font-bold text-sidebar group-hover:text-primary transition-colors">{route.from} → {route.to}</h3>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {route.duration}</span>
                  <span className="flex items-center gap-1 font-bold text-sidebar"><Users className="w-4 h-4" /> Luxury Bus</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-2xl font-black text-sidebar">{route.price} <span className="text-xs font-medium">ETB</span></p>
                  <button className="btn-secondary !rounded-xl">Book Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-sidebar">Safe & Secure</h3>
              <p className="text-gray-500 leading-relaxed">Verified drivers and real-time GPS monitoring on all our luxury buses.</p>
            </div>
            <div className="space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-sidebar">Always On Time</h3>
              <p className="text-gray-500 leading-relaxed">Our schedules are strictly maintained with over 98% on-time departure rate.</p>
            </div>
            <div className="space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-sidebar">Premium Comfort</h3>
              <p className="text-gray-500 leading-relaxed">Air conditioning, reclining seats, and onboard entertainment for your journey.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Dabub Connect" className="w-12 h-12 rounded-xl" />
                <div>
                  <h2 className="text-2xl font-black tracking-tight">DABUB CONNECT</h2>
                  <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Transport Management</p>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                The leading transportation network connecting Arba Minch to the rest of Ethiopia since 2024.
              </p>
              <div className="flex gap-4">
                <Facebook className="w-5 h-5 text-white/40 hover:text-primary cursor-pointer" />
                <Twitter className="w-5 h-5 text-white/40 hover:text-primary cursor-pointer" />
                <Instagram className="w-5 h-5 text-white/40 hover:text-primary cursor-pointer" />
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-bold text-lg">Quick Links</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Search Buses</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Track My Bus</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Route Maps</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terminal Locations</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-lg">Company</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-lg">Contact Us</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-primary" /> +251 911 123 456</li>
                <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-primary" /> info@semenconnect.et</li>
                <li className="flex items-center gap-3 leading-relaxed">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  Main Terminal, Arba Minch <br /> Ethiopia
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/10 text-center text-[10px] text-white/30 uppercase tracking-[0.2em]">
            © 2024 Dabub Connect Transport Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
