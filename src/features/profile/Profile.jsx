import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { getInitials, isValidPhone } from '../../utils/helpers';
import { DEPARTMENTS } from '../../constants';
import API from '../../config/api';

export default function Profile() {
  const { user, login } = useAuth();
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    department: user?.department || '',
    phone: user?.phone || ''
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [verifyInfo, setVerifyInfo] = useState(null); // Twilio caller-ID verification prompt

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg(''); setProfileError(''); setVerifyInfo(null);

    // Validate phone format before hitting the server.
    if (profileData.phone && !isValidPhone(profileData.phone)) {
      return setProfileError('Enter a valid mobile number (9 digits after +94).');
    }

    try {
      const res = await API.put('/employees/update-profile', {
        email: user.email,
        newEmail: profileData.email,
        newDepartment: profileData.department,
        newPhone: profileData.phone
      });
      if (res.data.success) {
        setProfileMsg('Profile updated successfully!');
        // Update local context (keep name — the API response omits it)
        login(res.data.data.email, user.name, res.data.data.role, res.data.data._id, res.data.data.department, res.data.data.phone || '');

        // If the phone changed, Twilio is calling to verify it — show the code.
        const sv = res.data.smsVerification;
        if (sv?.started && sv?.validationCode) {
          setVerifyInfo({ code: sv.validationCode, phone: res.data.data.phone });
        } else {
          setTimeout(() => setIsEditingProfile(false), 1500);
        }
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    
    if (passwords.new !== passwords.confirm) {
      return setError("New passwords don't match.");
    }
    
    try {
      const res = await API.post('/employees/change-password', {
        email: user.email,
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      if (res.data.success) {
        setMsg('Password updated successfully!');
        setPasswords({ current: '', new: '', confirm: '' });
        setTimeout(() => setShowPasswordForm(false), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <DashboardLayout isAdmin={user?.role === 'Admin'}>
      <div className="w-full space-y-8 text-slate-700 animate-fade-in-up">
        
        {/* Header */}
        <div className="pb-2 border-b border-slate-200/50">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">User Profile</h1>
          <p className="text-slate-500 text-xs mt-2 uppercase font-semibold tracking-wider">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="glass-card max-w-3xl rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
          
          {/* Decorative background shape */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
            {/* Avatar */}
            <div className="flex-shrink-0 relative group">
              <div className="w-32 h-32 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-5xl font-bold shadow-lg shadow-blue-500/20 uppercase tracking-widest ring-4 ring-blue-50">
                {getInitials(user?.name)}
              </div>
              <button 
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="absolute -bottom-3 -right-3 w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-md text-slate-500 hover:text-blue-600 hover:scale-110 transition-all"
              >
                ✏️
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{user?.name || 'Jane Doe'}</h2>
                <div className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-bold uppercase tracking-widest">
                  {user?.role || 'Employee'}
                </div>
              </div>
              
              {!isEditingProfile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/60 w-full">
                  <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 p-4 rounded-2xl shadow-sm overflow-hidden">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-1">Email Address</span>
                    <span className="font-semibold text-slate-700 text-sm flex flex-wrap items-center gap-2 break-all">
                      <span className="text-slate-400">📧</span> {user?.email || 'jane.doe@uom.lk'}
                    </span>
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 p-4 rounded-2xl shadow-sm">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-1">Department</span>
                    <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <span className="text-slate-400">🏢</span> {user?.department || 'Information Technology'}
                    </span>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 p-4 rounded-2xl shadow-sm sm:col-span-2 overflow-hidden">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-1">Mobile Number</span>
                    <span className="font-semibold text-slate-700 text-sm flex flex-wrap items-center gap-2">
                      <span className="text-lg">🇱🇰</span>
                      <span className="break-words">
                        {user?.phone || <span className="text-slate-400 italic">Not set — add your number to receive SMS alerts</span>}
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="pt-4 border-t border-slate-200/60 w-full space-y-4">
                  {profileError && <div className="text-red-500 text-xs font-bold p-2 bg-red-50 rounded-lg">{profileError}</div>}
                  {profileMsg && <div className="text-emerald-500 text-xs font-bold p-2 bg-emerald-50 rounded-lg">{profileMsg}</div>}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                      <input 
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department</label>
                      <select
                        value={profileData.department}
                        onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        required
                      >
                        <option value="">Select department</option>
                        {DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                        <option value="Dean's Office">Dean's Office</option>
                      </select>
                    </div>
                  </div>

                  {/* Mobile Number with SL prefix */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number</label>
                    <p className="text-xs text-slate-500 mb-2">🇱🇰 Sri Lanka — Used to receive SMS delivery alerts</p>
                    <div className="flex items-stretch gap-2">
                      {/* Sri Lanka flag prefix */}
                      <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 whitespace-nowrap">
                        <span className="text-lg">🇱🇰</span> +94
                      </div>
                      <input
                        type="tel"
                        value={profileData.phone.replace(/^\+94/, '')}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
                          setProfileData({...profileData, phone: digits ? `+94${digits}` : ''});
                        }}
                        placeholder="77 XXXXXXX"
                        maxLength={9}
                        className="flex-1 min-w-0 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm tracking-widest"
                      />
                    </div>
                    {profileData.phone && (
                      <p className="mt-1 text-xs text-emerald-600 font-medium">✅ Will send as: {profileData.phone}</p>
                    )}
                  </div>

                  {/* Twilio caller-ID verification prompt (shown after a phone change) */}
                  {verifyInfo && (
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xl">📞</span>
                        <span className="font-extrabold text-sm">Verify your mobile for SMS alerts</span>
                      </div>
                      <p className="text-xs leading-relaxed mb-2">
                        Twilio is calling <span className="font-bold">{verifyInfo.phone}</span>. Answer and enter this
                        code on your keypad when prompted:
                      </p>
                      <div className="text-center bg-white border border-blue-200 rounded-xl py-2">
                        <span className="text-2xl font-black tracking-[0.3em] text-blue-700">{verifyInfo.code}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-widest shadow-md">
                      Save Changes
                    </button>
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Security Settings Area */}
        <div className="glass-card max-w-3xl rounded-3xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1">Security Settings</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Manage password and auth</p>
          
          {!showPasswordForm ? (
            <button 
              onClick={() => setShowPasswordForm(true)}
              className="w-full sm:w-auto py-3 px-6 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm text-xs uppercase tracking-widest active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>🔒</span> Change Password
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm mt-4 bg-white/50 p-6 rounded-2xl border border-slate-200/50">
              {error && <div className="text-red-500 text-xs font-bold p-2 bg-red-50 rounded-lg">{error}</div>}
              {msg && <div className="text-emerald-500 text-xs font-bold p-2 bg-emerald-50 rounded-lg">{msg}</div>}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={passwords.current}
                  onChange={e => setPasswords({...passwords, current: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                <input 
                  type="password" 
                  value={passwords.new}
                  onChange={e => setPasswords({...passwords, new: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwords.confirm}
                  onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-widest shadow-md">
                  Update
                </button>
                <button type="button" onClick={() => { setShowPasswordForm(false); setError(''); setMsg(''); }} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
