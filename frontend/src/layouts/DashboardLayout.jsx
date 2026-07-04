import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import ChatAgent from '../components/ChatAgent';

export default function DashboardLayout({ children, isAdmin = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, notifications, activePopup, closePopup } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = isAdmin 
    ? [
        { name: 'Admin Dashboard', path: '/admin/dashboard', icon: '🎛️' },
        { name: 'Reports & Analytics', path: '/admin/analytics', icon: '📈' },
        { name: 'Profile', path: '/admin/profile', icon: '👤' },
      ]
    : [
        { name: 'Dashboard', path: '/user/dashboard', icon: '📊' },
        { name: 'Create Delivery', path: '/user/create-delivery', icon: '📝' },
        { name: 'Profile', path: '/user/profile', icon: '👤' },
      ];

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden relative font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[100px] pointer-events-none opacity-50"></div>
      <div className="absolute bottom-0 left-[250px] w-[500px] h-[500px] bg-slate-200 rounded-full blur-[100px] pointer-events-none opacity-50"></div>

      {/* ================= LIVE POP-UP CARD FOR REAL-TIME SIMULATION ================= */}
      {activePopup && (
        <div className="absolute top-6 right-6 z-50 glass-card border-l-4 border-l-blue-600 shadow-xl rounded-2xl p-5 w-80 transition-all duration-300 animate-fade-in-down">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
              {activePopup.title}
            </h4>
            <button onClick={closePopup} className="text-slate-400 hover:text-slate-600 transition font-bold text-sm ml-4">✕</button>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-sans">{activePopup.message}</p>
          <div className="flex justify-between items-center mt-4 pt-2.5 border-t border-slate-200/50">
            <span className="text-xs text-slate-400">{activePopup.time}</span>
            <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded uppercase tracking-wider">Live Status</span>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="w-64 glass-panel border-r border-slate-200/50 flex flex-col justify-between p-6 z-20 shadow-sm relative backdrop-blur-xl">
        <div className="space-y-8">
          {/* Logo Brand Header */}
          <div className="flex items-center space-x-3 px-2 py-3 border-b border-slate-200/50">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">OfficeMate</h1>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-slate-500 font-semibold">
                  {isAdmin ? 'Admin Portal' : 'Employee Portal'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 text-left group relative overflow-hidden ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'hover:bg-white/60 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`text-lg transition-transform group-hover:scale-110 duration-300 z-10 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm font-semibold z-10 ${isActive ? 'text-white' : ''}`}>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Control */}
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 text-left group mt-auto"
        >
          <span className="text-lg group-hover:rotate-12 transition-transform duration-300">🚪</span>
          <span className="text-sm font-semibold">Log Out</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Top Navbar */}
        <header className="h-20 glass-panel border-b border-slate-200/50 flex justify-between items-center px-8 relative z-30 shadow-sm backdrop-blur-xl">
          <div>
            <h2 className="text-base font-bold text-slate-700">
              {isAdmin ? 'Admin Dashboard' : 'Delivery Service'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-6">
            
            {/* 🔔 Notification Bell Button with Badge */}
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)} 
                className="text-slate-500 hover:text-blue-600 transition-colors text-xl relative focus:outline-none p-2 rounded-xl hover:bg-white/60"
              >
                🔔
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification History List Dropdown Panel */}
              {showDropdown && (
                <div className="absolute right-0 mt-3 w-80 glass-card shadow-2xl rounded-2xl z-50 max-h-96 overflow-y-auto animate-fade-in-up border border-slate-200/50">
                  <div className="p-4 border-b border-slate-200/50 font-bold text-sm text-slate-700 bg-white/50 rounded-t-2xl flex justify-between items-center backdrop-blur-md">
                    <span>Notifications Log</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{notifications.length} message(s)</span>
                  </div>
                  <div className="divide-y divide-slate-100/50 bg-white/30 backdrop-blur-md">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-500 font-medium">No new notifications.</div>
                    ) : (
                      notifications.map(n => (
                         <div key={n.id} className="p-4 hover:bg-white/60 transition-colors cursor-pointer space-y-1.5">
                           <p className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                             <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                             {n.title}
                           </p>
                           <p className="text-sm text-slate-600 leading-relaxed font-medium">{n.message}</p>
                           <span className="text-xs text-slate-400 block font-semibold">{n.time}</span>
                         </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Card */}
            <div className="flex items-center space-x-4 pl-6 relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-8 before:w-px before:bg-slate-200">
              <div className="text-right hidden sm:block">
                <span className="block text-sm font-bold text-slate-800">{user?.name || 'Jane Doe'}</span>
                <span className="block text-xs text-slate-500 font-semibold mt-0.5">{user?.role || 'Employee'}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                {getInitials(user?.name)}
              </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 relative z-10">
          <div className="max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Chat Agent integration */}
      <ChatAgent />
    </div>
  );
}
