import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Bus, Eye, EyeOff, Loader2, Shield, CheckCircle, AlertTriangle, Fingerprint, Smartphone, Lock, Clock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');
    
    if (lockoutTime && Date.now() < lockoutTime) {
      const remaining = Math.ceil((lockoutTime - Date.now()) / 60000);
      return toast.error(`Account locked. Try again in ${remaining} minutes.`);
    }
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password, rememberMe });
      
      if (data.data.requiresTwoFactor) {
        setShowTwoFactor(true);
        toast.success('Two-factor authentication required');
      } else {
        login(data.data);
        toast.success(`Welcome back, ${data.data.user.name}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginAttempts(prev => prev + 1);
      if (loginAttempts >= 4) {
        setLockoutTime(Date.now() + 15 * 60 * 1000); // 15 minute lockout
        toast.error('Too many failed attempts. Account locked for 15 minutes.');
      } else {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    if (!twoFactorCode) return toast.error('Please enter the verification code');
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-2fa', { email, twoFactorCode });
      login(data.data);
      toast.success('Authentication successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar via-primary-900 to-primary relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-gold mx-auto mb-4 flex items-center justify-center shadow-glow">
              <Bus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-sidebar font-amharic">ደቡብ ኮኔክት</h1>
            <p className="text-sm text-gray-500 mt-1">Arba Minch Transport Management System</p>
            <p className="text-xs text-gold-dark mt-1 font-amharic">"ወደ አዲስ አቅጣጫ"</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@semenconnect.com" className="input" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input id="login-password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded" />
                Remember me
              </label>
            </div>
            <button id="login-submit" type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {showTwoFactor && (
            <form onSubmit={handleTwoFactorSubmit} className="space-y-4 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sidebar">Two-Factor Authentication</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
                <div className="relative">
                  <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="Enter 6-digit code" className="input" maxLength={6} />
                  <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter the code sent to your device</p>
              </div>
              <button type="submit" disabled={loading || twoFactorCode.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          )}

          {loginAttempts > 0 && (
            <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${loginAttempts >= 4 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              {loginAttempts >= 4 ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <Clock className="w-4 h-4 text-yellow-600" />}
              <p className="text-xs">
                {loginAttempts >= 4 
                  ? 'Account temporarily locked due to multiple failed attempts.' 
                  : `${loginAttempts} failed attempt${loginAttempts > 1 ? 's' : ''}. ${5 - loginAttempts} attempts remaining before lockout.`}
              </p>
            </div>
          )}
          <div className="mt-4 flex justify-between text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
            <Link to="/register" className="text-primary hover:underline">Create account</Link>
          </div>
          <div className="mt-6 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-center text-gray-500"><strong>Demo:</strong> Register via API or seed data.</p>
          </div>
        </div>
        <p className="text-center text-xs text-white/40 mt-6">© 2026 Dabub Connect • Arba Minch, Ethiopia</p>
      </div>
    </div>
  );
}
