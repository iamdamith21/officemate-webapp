import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import API from '../../config/api';
import { DEPARTMENTS } from '../../constants';
import { formatRfidInput, isValidRfidHex, isValidPhone } from '../../utils/helpers';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    rfid: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verifyInfo, setVerifyInfo] = useState(null); // Twilio caller-ID verification prompt

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'rfid') {
      // Auto-format RFID as hex pairs: XX XX XX XX
      setFormData(prev => ({ ...prev, rfid: formatRfidInput(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!isValidRfidHex(formData.rfid)) {
      setErrorMsg('RFID Card Number must be in hexadecimal format (e.g., 38 8B 95 1A).');
      return;
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      setErrorMsg('Enter a valid mobile number (9 digits after +94).');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/employees/register', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        department: formData.department,
        rfidTag: formData.rfid.toUpperCase(),
        password: formData.password,
        role: 'Lecturer'
      });

      if (response.data.success) {
        const sv = response.data.smsVerification;
        if (sv?.started && sv?.validationCode) {
          // Twilio is calling the user's phone — show the code and let them
          // finish the call before continuing to login (no auto-redirect).
          setSuccessMsg('Account created successfully!');
          setVerifyInfo({ code: sv.validationCode, phone: formData.phone.trim() });
        } else {
          setSuccessMsg('Account created successfully! Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        }
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      setErrorMsg(msg);
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22.08V12" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">OfficeMate</h2>
          <p className="text-blue-600 font-bold text-[10px] mt-1.5 uppercase tracking-widest">Autonomous Robotic Delivery</p>
          <p className="text-slate-500 text-sm mt-4 font-medium">Create a new account</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium flex items-start space-x-3 shadow-sm">
            <span className="text-lg mt-0.5">⚠️</span>
            <span className="flex-1 leading-relaxed">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-sm font-semibold flex items-center space-x-3 shadow-sm">
            <span className="text-xl">✅</span>
            <span>{successMsg}</span>
          </div>
        )}
        {verifyInfo && (
          <div className="mb-6 p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">📞</span>
              <h3 className="font-extrabold text-base tracking-tight">Verify your mobile for SMS alerts</h3>
            </div>
            <p className="text-sm leading-relaxed mb-3">
              Twilio is calling <span className="font-bold">{verifyInfo.phone}</span> now. Answer the call and,
              when prompted, enter this verification code on your phone keypad:
            </p>
            <div className="text-center bg-white border border-blue-200 rounded-xl py-3 mb-3">
              <span className="text-3xl font-black tracking-[0.3em] text-blue-700">{verifyInfo.code}</span>
            </div>
            <p className="text-xs text-blue-700 mb-4">
              Once verified, you'll receive an SMS whenever someone sends you a delivery. You can do this later from
              your profile if you miss the call.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-xs uppercase tracking-wider"
            >
              Continue to Login
            </button>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Row 1: Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Dr. / Mr. / Ms. Full Name"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm transition"
            />
          </div>

          {/* Row 2: Email */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Staff Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@uom.lk"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm transition"
            />
          </div>

          {/* Row 2b: Mobile Number (for SMS delivery alerts) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mobile Number</label>
            <div className="flex items-stretch gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 whitespace-nowrap">
                <span className="text-lg">🇱🇰</span> +94
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone.replace(/^\+94/, '')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
                  setFormData(prev => ({ ...prev, phone: digits ? `+94${digits}` : '' }));
                }}
                placeholder="77 XXXXXXX"
                maxLength={9}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm transition tracking-widest"
              />
            </div>
          </div>

          {/* Row 3: Department */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Department</label>
            <select
              name="department"
              required
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 text-sm cursor-pointer transition"
            >
              <option value="">Select your department</option>
              {DEPARTMENTS.map(dept => (
                <option 
                  key={dept} 
                  value={dept}
                  disabled={dept !== 'Department of Information Technology'}
                  className={dept !== 'Department of Information Technology' ? 'text-slate-400' : 'text-slate-800 font-medium'}
                >
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Row 4: RFID — Hexadecimal format */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              RFID Card Number
            </label>
            <input
              type="text"
              name="rfid"
              required
              value={formData.rfid}
              onChange={handleChange}
              placeholder="e.g., 38 8B 95 1A"
              maxLength={11}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm transition font-mono tracking-widest uppercase"
            />
            {formData.rfid && !isValidRfidHex(formData.rfid) && formData.rfid.length > 0 && (
              <p className="mt-1.5 text-xs text-amber-600 font-medium">
                ⚠️ Format: 4 hex pairs separated by spaces (e.g., 38 8B 95 1A)
              </p>
            )}
            {isValidRfidHex(formData.rfid) && (
              <p className="mt-1.5 text-xs text-emerald-600 font-medium">
                ✅ Valid RFID format
              </p>
            )}
          </div>

          {/* Row 5: Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 text-sm transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md active:scale-[0.98] text-sm uppercase tracking-wide disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
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
