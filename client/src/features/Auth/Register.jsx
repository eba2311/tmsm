import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Bus, User, Mail, Lock, Loader2, ArrowLeft, ShieldCheck, Smartphone } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'PASSENGER',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = formData;
    if (!name || !email || !password) return toast.error('Please fill all required fields');
    
    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar via-primary-900 to-primary relative overflow-hidden py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      </div>
      
      <div className="relative w-full max-w-xl mx-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-gold mx-auto mb-4 flex items-center justify-center shadow-glow">
              <Bus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-sidebar font-amharic">ደቡብ ኮኔክት</h1>
            <h2 className="text-xl font-bold text-sidebar mt-2">Create Account</h2>
            <p className="text-sm text-gray-500 mt-1">Join the Arba Minch modern transport network</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Abebe Bikila"
                    className="input pl-10"
                    required
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+251 9..."
                    className="input pl-10"
                  />
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="abebe@example.et"
                  className="input pl-10"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input pl-10"
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Minimum 6 characters</p>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'PASSENGER' }))}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    formData.role === 'PASSENGER' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-500'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Passenger</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'AGENT' }))}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    formData.role === 'AGENT' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-500'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Agent</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-4"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Creating Account...' : 'Create Free Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
            </p>
            <Link to="/" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-primary transition-colors">
              <ArrowLeft className="w-3 h-3" />
              Return to Website
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-white/40 mt-6">© 2026 Dabub Connect • Arba Minch, Ethiopia</p>
      </div>
    </div>
  );
}
