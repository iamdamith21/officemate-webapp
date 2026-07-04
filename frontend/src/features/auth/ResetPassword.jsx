import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import API from '../../config/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await API.post('/employees/reset-password', { 
        token, 
        newPassword: password 
      });

      if (response.data.success) {
        setMessage('Password has been successfully reset. Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to reset password. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mb-5 shadow-lg shadow-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">New Password</h2>
          <p className="text-slate-500 text-sm mt-4 font-medium">Please enter your new password below.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium flex items-start space-x-3 shadow-sm">
            <span className="text-lg mt-0.5">⚠️</span>
            <span className="flex-1 leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-start space-x-3 shadow-sm">
            <span className="text-lg mt-0.5">✅</span>
            <span className="flex-1 leading-relaxed">{message}</span>
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">New Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-400 text-sm">🔒</span>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm placeholder-slate-400 transition" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Confirm New Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-400 text-sm">🔒</span>
              <input 
                type="password" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm placeholder-slate-400 transition" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !!message}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md active:scale-[0.98] text-xs uppercase tracking-wider disabled:opacity-60"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div className="text-center pt-2 border-t border-slate-100">
            <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-700 transition">
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
