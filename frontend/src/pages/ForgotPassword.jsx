import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import API from '../api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMsg('');

    try {
      const response = await API.post('/employees/forgot-password', { email: email.trim().toLowerCase() });
      if (response.data.success) {
        setMessage(response.data.message || 'Reset instructions sent to your email.');
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to send reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden animate-fade-in-up">
        {/* Subtle accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

        <h2 className="text-3xl font-black text-slate-800 mb-2 text-center tracking-tight font-sans">Reset Password</h2>
        <p className="text-slate-500 text-sm text-center mb-8 font-medium">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
        
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 backdrop-blur-sm border border-amber-200 text-amber-800 text-sm font-medium flex items-start space-x-3 shadow-sm animate-fade-in-down">
            <span className="text-xl mt-0.5 animate-bounce">⚠️</span>
            <span className="flex-1 leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 text-emerald-800 text-sm font-medium flex items-start space-x-3 shadow-sm animate-fade-in-down">
            <span className="text-xl mt-0.5">✅</span>
            <span className="flex-1 leading-relaxed">{message}</span>
          </div>
        )}

        <form onSubmit={handleResetRequest} className="space-y-6">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
            <div className="relative group">
              <span className="absolute left-4 top-3.5 text-slate-400 text-lg transition-transform group-focus-within:-translate-y-1 group-focus-within:text-blue-500 duration-300">📧</span>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@uom.lk"
                className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm font-medium placeholder-slate-400 transition-all shadow-sm" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] text-[11px] uppercase tracking-widest disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Sending...
              </span>
            ) : 'Send Reset Instructions'}
          </button>

          <div className="text-center pt-6 border-t border-slate-200/50">
            <Link to="/login" className="text-xs font-extrabold uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}