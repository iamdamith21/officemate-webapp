import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

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
                {user?.name ? (user.name.split(' ').length > 1 ? user.name.split(' ')[0][0] + user.name.split(' ')[1][0] : user.name.slice(0,2)) : 'US'}
              </div>
              <button className="absolute -bottom-3 -right-3 w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-md text-slate-500 hover:text-blue-600 hover:scale-110 transition-all">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/60 w-full">
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 p-4 rounded-2xl shadow-sm">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-1">Email Address</span>
                  <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                    <span className="text-slate-400">📧</span> {user?.email || 'jane.doe@uom.lk'}
                  </span>
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/50 p-4 rounded-2xl shadow-sm">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-1">Department</span>
                  <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                    <span className="text-slate-400">🏢</span> {user?.department || 'Information Technology'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Area */}
        <div className="glass-card max-w-3xl rounded-3xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1">Security Settings</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Manage password and auth</p>
          
          <button 
            className="w-full sm:w-auto py-3 px-6 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm text-xs uppercase tracking-widest active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>🔒</span> Change Password
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}