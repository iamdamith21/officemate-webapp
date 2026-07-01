import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import API from '../api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await API.post('/employees/login', {
        email: email.trim().toLowerCase(),
        password
      });

      if (response.data.success) {
        const { _id, name, email: userEmail, role, department } = response.data.data;
        login(userEmail, name, role, _id, department);

        if (role === 'Admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/user/dashboard');
        }
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="glass-card rounded-3xl p-8 sm:p-12 relative w-full max-w-md mx-auto animate-fade-in-up">
        {/* Glow effect behind logo */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-500 rounded-full blur-[40px] opacity-10 -z-10"></div>
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-6 shadow-lg shadow-blue-500/20 ring-4 ring-blue-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22.08V12" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">OfficeMate</h2>
          <p className="text-blue-600 font-bold text-xs mt-2 uppercase tracking-widest">Autonomous Robotic Delivery</p>
          <p className="text-slate-500 text-sm mt-3 font-medium">Please sign in to your account</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50/80 backdrop-blur-md border border-red-100 text-red-600 text-sm font-medium flex items-start space-x-3 shadow-sm animate-fade-in-down">
            <span className="text-lg mt-0.5">⚠️</span>
            <span className="flex-1 leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
              University Email
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-3.5 text-slate-400 text-sm transition-colors group-focus-within:text-blue-500">📧</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@uom.lk"
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 text-sm placeholder-slate-400 transition-all hover:bg-white/80 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
              <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                Forgot Password?
              </Link>
            </div>
            <div className="relative group">
              <span className="absolute left-4 top-3.5 text-slate-400 text-sm transition-colors group-focus-within:text-blue-500">🔒</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 text-sm placeholder-slate-400 transition-all hover:bg-white/80 shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] text-sm tracking-wide uppercase disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center pt-6 pb-2 border-t border-slate-100/60 mt-8">
            <span className="text-sm text-slate-500">New lecturer? </span>
            <Link to="/register" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors ml-1">
              Create an Account
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}