import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Bus, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [search] = useSearchParams();
  const token = search.get('token');
  const email = search.get('email');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return toast.error('Password is required');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    
    setLoading(true);
    try {
      await api.post('/auth/reset', { email, token, password });
      setSuccess(true);
      toast.success('Password reset successful');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar via-primary-900 to-primary">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Link</h2>
          <p className="text-gray-500 mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" size="sm" className="btn-primary inline-block">Request New Link</Link>
        </div>
      </div>
    );
  }

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
            <h2 className="text-xl font-bold text-sidebar mt-2">New Password</h2>
            <p className="text-sm text-gray-500 mt-1">Create a secure password for your account</p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-sidebar">Password Reset Successful!</p>
              <p className="text-xs text-gray-500">
                Your password has been updated. You will be redirected to the login page in a few seconds.
              </p>
              <Link to="/login" className="btn-primary block">Sign In Now</Link>
            </div>
          )}

          {!success && (
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-white/40 mt-6">© 2026 Dabub Connect • Arba Minch, Ethiopia</p>
      </div>
    </div>
  );
}
