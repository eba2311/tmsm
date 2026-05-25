import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Bus, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address');
    
    setLoading(true);
    try {
      await api.post('/auth/forgot', { email });
      setSubmitted(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
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
            <h2 className="text-xl font-bold text-sidebar mt-2">Reset Password</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your email to receive a password reset link</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@semenconnect.et"
                    className="input pl-10"
                    autoComplete="email"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                A password reset link has been sent to <strong>{email}</strong>.
                Please check your inbox (and spam folder).
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-primary text-sm font-medium hover:underline"
              >
                Didn't receive it? Try again
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-white/40 mt-6">© 2026 Dabub Connect • Arba Minch, Ethiopia</p>
      </div>
    </div>
  );
}
