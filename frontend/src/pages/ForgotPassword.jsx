import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, KeyRound, Lock, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const data = await forgotPassword({ email });
      if (data.devOtp) {
        // Local/dev convenience only — in production this comes via email.
        toast(`Dev OTP: ${data.devOtp}`, { icon: '🔑', duration: 8000 });
      }
      setStep('reset');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Enter the code sent to your email');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword });
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset failed. Check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-glow-radial" />
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-glow-gradient flex items-center justify-center shadow-glow mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {step === 'request' ? 'Reset your password' : 'Enter reset code'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 text-center">
            {step === 'request'
              ? "We'll send a 6-digit code to your email"
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        {step === 'request' ? (
          <form onSubmit={handleRequest} className="glass-card p-6 sm:p-8 space-y-4 animate-fadeUp">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="glow-btn w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Sending code…' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="glass-card p-6 sm:p-8 space-y-4 animate-fadeUp">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Reset code</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input-field pl-10 tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">New password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="glow-btn w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-zinc-500 mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="text-accent-violet hover:text-accent-indigo font-medium transition-colors">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
