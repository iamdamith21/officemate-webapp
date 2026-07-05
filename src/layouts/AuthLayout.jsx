import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_VERSION } from '../constants';

export default function AuthLayout({ children }) {
  const location = useLocation();
  const { isRosConnected } = useAuth();
  const isRegister = location.pathname.includes('register');
  const isForgot = location.pathname.includes('forgot-password');

  return (
    <div className="min-h-screen w-screen flex bg-slate-50 m-0 p-0 overflow-hidden relative font-sans text-slate-700">
      {/* Premium ambient animated background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-500/20 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }}></div>

      {/* 🤖 LEFT BANNER PANEL */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden text-white shadow-2xl">
        {/* Soft grid decoration */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Header logo */}
        <div className="flex items-center space-x-4 z-10 animate-fade-in-down">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-white">OfficeMate</span>
            <span className="block text-xs text-blue-300 uppercase font-bold tracking-widest mt-1">Autonomous Delivery System</span>
          </div>
        </div>

        {/* Dynamic descriptions */}
        <div className="max-w-md my-auto space-y-8 z-10 animate-fade-in-up">
          {isRegister ? (
            <>
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white text-sm font-semibold shadow-inner">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping"></span>
                <span>Employee Registration</span>
              </div>
              <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
                Join the <br/> Autonomous <br/> Office.
              </h1>
              <p className="text-blue-200/80 text-base leading-relaxed">
                Create your account to request deliveries, track packages, and securely unlock cabinet locker compartments.
              </p>
            </>
          ) : isForgot ? (
            <>
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white text-sm font-semibold shadow-inner">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Account Recovery</span>
              </div>
              <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
                Recover Your <br/> Access.
              </h1>
              <p className="text-blue-200/80 text-base leading-relaxed">
                Confirm your staff email to reset your login password and regain access to the robot dashboard.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white text-sm font-semibold shadow-inner">
                <span className={`h-2 w-2 rounded-full ${isRosConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-500 animate-pulse'}`}></span>
                <span>{isRosConnected ? 'System Online' : 'System Offline'}</span>
              </div>
              <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
                Seamless <br />Office <br />Deliveries.
              </h1>
              <p className="text-blue-200/80 text-base leading-relaxed">
                Send documents and packages to colleagues around the office. Dispatch the robot and monitor its progress live.
              </p>
            </>
          )}
        </div>

        {/* Footer — Combined version */}
        <div className="text-blue-300/50 text-sm font-medium z-10">
          <span>{APP_VERSION}</span>
        </div>
      </div>

      {/* 🤍 RIGHT CONTENT AREA (CARDS) */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 overflow-y-auto z-10 relative">
        <div className="w-full max-w-[480px]">
          {children}
        </div>
      </div>
    </div>
  );
}
