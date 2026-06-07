import { useNavigate } from 'react-router-dom';
import { 
  Bus, MapPin, Calendar, Users, Search, 
  ArrowRight, Shield, Clock, Star, Phone,
  Facebook, Twitter, Instagram, Mail, Menu, X
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-gold flex items-center justify-center">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-sidebar tracking-tight">DABUB CONNECT</h1>
                <p className="text-[9px] font-bold text-primary tracking-widest uppercase">Transport</p>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#routes" className="text-sm font-bold text-sidebar hover:text-primary transition-colors">Routes</a>
              <a href="#features" className="text-sm font-bold text-sidebar hover:text-primary transition-colors">Features</a>
              <a href="#contact" className="text-sm font-bold text-sidebar hover:text-primary transition-colors">Contact</a>
              <button 
                onClick={() => navigate('/login')}
                className="btn-primary !rounded-full px-8 py-2"
              >
                Sign In
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-sidebar"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-3 border-t">
              <a href="#routes" className="block text-sm font-bold text-sidebar hover:text-primary">Routes</a>
              <a href="#features" className="block text-sm font-bold text-sidebar hover:text-primary">Features</a>
              <a href="#contact" className="block text-sm font-bold text-sidebar hover:text-primary">Contact</a>
              <button 
                onClick={() => navigate('/login')}
                className="btn-primary w-full !rounded-full py-2"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-white" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-sidebar mb-6 leading-tight">
              Your Trusted <br /> 
              <span className="text-primary">Transport Partner</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-8">
              Safe, reliable, and comfortable intercity travel across Ethiopia. Book your tickets online and enjoy a seamless journey.
            </p>

            {/* Search Card */}
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-4 md:p-8 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-left space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">From</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <input 
                      type="text" 
                      placeholder="Arba Minch" 
                      className="input pl-10 h-12 bg-gray-50 border-transparent focus:bg-white"
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
                      className="input pl-10 h-12 bg-gray-50 border-transparent focus:bg-white"
                    />
                  </div>
                </div>
                <div className="text-left space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <input 
                      type="date" 
                      className="input pl-10 h-12 bg-gray-50 border-transparent focus:bg-white"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button className="btn-primary w-full h-12 !rounded-2xl text-sm md:text-base flex items-center justify-center gap-2">
                    <Search className="w-4 h-4" /> Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Routes */}
      <section id="routes" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-sidebar">Popular Routes</h2>
              <p className="text-gray-500 mt-3">Daily departures to major cities</p>
            </div>
            <button className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all mt-4 md:mt-0">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { from: 'Arba Minch', to: 'Addis Ababa', price: '850', duration: '8h 30m' },
              { from: 'Arba Minch', to: 'Hawassa', price: '450', duration: '4h 15m' },
              { from: 'Arba Minch', to: 'Jinka', price: '600', duration: '5h 45m' },
            ].map((route, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="relative h-56 md:h-64 rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
                  <div className="text-center">
                    <Bus className="w-16 h-16 text-primary/30 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Route Image</p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-sidebar group-hover:text-primary transition-colors">{route.from} → {route.to}</h3>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {route.duration}</span>
                  <span className="flex items-center gap-1 font-bold text-sidebar"><Users className="w-4 h-4" /> Luxury</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-2xl font-black text-sidebar">{route.price} <span className="text-xs font-medium">ETB</span></p>
                  <button 
                    onClick={() => navigate('/login')}
                    className="btn-secondary !rounded-xl px-4 py-2 text-sm"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-black text-sidebar text-center mb-16">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-sidebar">Safe & Secure</h3>
              <p className="text-gray-500 leading-relaxed">Verified drivers and real-time GPS monitoring on all our luxury buses for your safety.</p>
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

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-sidebar to-primary/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Ready to Book Your Journey?</h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">Create an account or sign in to book your next trip today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="btn-primary bg-white text-primary hover:bg-gray-100 px-8 py-3 rounded-full font-bold"
            >
              Create Account
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="btn-secondary border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-bold"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-sidebar py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-gold flex items-center justify-center">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">DABUB CONNECT</h2>
                  <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Transport</p>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                The leading transportation network connecting communities across Ethiopia since 2024.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-white/40 hover:text-primary transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-white/40 hover:text-primary transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-white/40 hover:text-primary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-bold text-lg">Quick Links</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Search Buses</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Track Bus</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Routes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terminal</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-lg">Company</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-lg">Contact</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary flex-shrink-0" /> +251 911 123 456</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary flex-shrink-0" /> info@dabubconnect.et</li>
                <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /> Main Terminal, Arba Minch, Ethiopia</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-[10px] text-white/30 uppercase tracking-[0.2em]">
            © 2024 Dabub Connect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
