import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import useRobotStatus from '../../hooks/useRobotStatus';
import { DELIVERY_STATES, ROOM_COORDS, BASE_COORDS } from '../../constants';
import { getStateIndex } from '../../utils/helpers';

// Extracts a first name, skipping common title prefixes
const getFirstName = (fullName) => {
  if (!fullName) return 'Lecturer';
  const titlePrefixes = ['mr.', 'mrs.', 'ms.', 'miss.', 'dr.', 'prof.', 'mr', 'mrs', 'ms', 'dr', 'prof'];
  const parts = fullName.trim().split(' ');
  // If first part is a title, skip it and return next
  if (titlePrefixes.includes(parts[0].toLowerCase()) && parts.length > 1) {
    return parts[1];
  }
  return parts[0];
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const {
    user,
    deliveryRequests,
    pendingConfirmations,
    confirmDelivery,
    declineDelivery,
    isRobotOnline
  } = useAuth();

  const robotStatus = useRobotStatus();

  // ── Derive key data ───────────────────────────────────────────
  // My sent deliveries (where I'm the sender)
  const mySentDeliveries = deliveryRequests.filter(req =>
    req.senderEmail?.toLowerCase() === user?.email?.toLowerCase()
  );

  // My received deliveries (where I'm the recipient)
  const myReceivedDeliveries = deliveryRequests.filter(req =>
    req.recipientEmail?.toLowerCase() === user?.email?.toLowerCase()
  );

  const allMyDeliveries = [...new Map(
    [...mySentDeliveries, ...myReceivedDeliveries].map(d => [d._id, d])
  ).values()];

  // Active delivery in progress
  const activeDelivery = deliveryRequests.find(req =>
    ['Heading to Sender', 'Heading to Recipient', 'Awaiting Pickup'].includes(req.status)
  );

  // Robot map position
  const getRobotCoords = () => {
    if (!activeDelivery) return BASE_COORDS;
    if (activeDelivery.status === 'Heading to Sender') {
      return ROOM_COORDS[activeDelivery.pickupLocation] || BASE_COORDS;
    }
    if (activeDelivery.status === 'Heading to Recipient' || activeDelivery.status === 'Awaiting Pickup') {
      const destRoom = activeDelivery.deliveryDestination?.split('—')[1]?.trim();
      return ROOM_COORDS[destRoom] || BASE_COORDS;
    }
    return BASE_COORDS;
  };

  const robotCoords = getRobotCoords();

  // Animation path for active transit
  const getAnimationPath = () => {
    if (!activeDelivery) return null;
    if (activeDelivery.status === 'Heading to Sender') {
      const dest = ROOM_COORDS[activeDelivery.pickupLocation] || BASE_COORDS;
      return `M ${BASE_COORDS.x} ${BASE_COORDS.y} L ${dest.x} ${dest.y}`;
    }
    if (activeDelivery.status === 'Heading to Recipient') {
      const destRoom = activeDelivery.deliveryDestination?.split('—')[1]?.trim();
      const src = ROOM_COORDS[activeDelivery.pickupLocation] || BASE_COORDS;
      const dest = ROOM_COORDS[destRoom] || BASE_COORDS;
      return `M ${src.x} ${src.y} L ${dest.x} ${dest.y}`;
    }
    return null;
  };

  const animationPath = getAnimationPath();
  const activeStateIndex = activeDelivery ? getStateIndex(activeDelivery.status) : -1;

  return (
    <DashboardLayout>
      <div className="w-full space-y-8 text-slate-700 animate-fade-in-up">

        {/* ── RECIPIENT CONFIRMATION POPUP ─────────────────────── */}
        {pendingConfirmations.length > 0 && pendingConfirmations.map(req => (
          <div
            key={req._id}
            className="glass-card border border-blue-200/60 rounded-3xl p-6 shadow-xl relative overflow-hidden"
            style={{ animation: 'fadeInDown 0.4s ease' }}
          >
            {/* Pulsing accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500" />

            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl shadow-sm">
                📬
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Incoming Delivery Request</h3>
                <p className="text-sm text-slate-500 mt-1">
                  <span className="font-bold text-slate-700">{req.employeeId?.name || 'A colleague'}</span> would like to send you documents via the delivery robot.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1.5">From Location</p>
                    <p className="font-bold text-slate-700 text-sm">{req.employeeId?.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{req.pickupLocation}</p>
                  </div>
                  <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1.5">Item Description</p>
                    <p className="font-bold text-slate-700 text-sm">{req.description || 'Documents'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-6">
                  <button
                    onClick={() => confirmDelivery(req._id)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
                  >
                    ✅ Accept Delivery
                  </button>
                  <button
                    onClick={() => declineDelivery(req._id)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all shadow-sm active:scale-[0.98]"
                  >
                    ✕ Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2 border-b border-slate-200/50">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Welcome, {getFirstName(user?.name)}!
            </h1>
            <p className="text-slate-500 text-sm mt-2 uppercase font-semibold tracking-wider">
              {user?.department || 'Faculty of Information Technology'} — OfficeMate Robot
            </p>
          </div>
          <div className={`flex items-center space-x-3 bg-white/60 backdrop-blur-md border px-5 py-2.5 rounded-2xl shadow-sm ${isRobotOnline ? 'border-emerald-200/60' : 'border-red-200/60'}`}>
            <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${isRobotOnline ? 'bg-emerald-500 animate-ping shadow-emerald-500' : 'bg-red-500 shadow-red-500'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isRobotOnline ? 'text-emerald-600' : 'text-red-600'}`}>
              {isRobotOnline ? 'Robot Sync Active' : 'Robot Offline'}
            </span>
          </div>
        </div>

        {/* ── DELIVERY STATE MACHINE TRACKER ───────────────────── */}
        <div className="relative z-10">
          {!isRobotOnline && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md rounded-3xl border border-red-100 shadow-inner">
              <span className="text-5xl mb-4 animate-bounce">⚠️</span>
              <h4 className="font-bold text-red-600 text-xl tracking-tight">Robot Offline / Not Powered</h4>
              <p className="text-sm text-slate-600 font-medium mt-1">Robot tracking is disabled until the robot is powered on and connected.</p>
            </div>
          )}
          {activeDelivery ? (
            <div className="glass-card rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">Active Delivery Tracker</h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">
                    ID #{activeDelivery._id?.slice(-6).toUpperCase()} · <span className="font-bold">{activeDelivery.description || 'Documents'}</span>
                  </p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-full font-bold uppercase tracking-widest animate-pulse shadow-sm">
                  In Progress
                </span>
              </div>

              {/* 6-step horizontal pipeline */}
              <div className="flex items-center justify-between relative px-2 sm:px-6">
                <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100/80 z-0 rounded-full" />
                {DELIVERY_STATES.map((state, index) => {
                  const isPassed = index < activeStateIndex;
                  const isActive = index === activeStateIndex;
                  return (
                    <div key={state.key} className="flex flex-col items-center z-10 relative flex-1">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base border-2 transition-all duration-300 ${
                        isActive ? 'bg-blue-600 border-transparent text-white shadow-lg shadow-blue-500/40 scale-125' :
                        isPassed ? 'bg-emerald-50 border-emerald-400 text-emerald-600 shadow-sm' :
                        'bg-white/80 border-slate-200 text-slate-400 backdrop-blur-sm'
                      }`}>
                        {isPassed ? '✓' : state.icon}
                      </div>
                      <span className={`text-xs font-semibold mt-3 text-center leading-tight uppercase tracking-wider hidden sm:block ${
                        isActive ? 'text-blue-600 font-bold' : isPassed ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {state.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Current state description */}
              <div className="mt-8 pt-5 border-t border-slate-200/50 text-center">
                <div className="inline-flex items-center justify-center space-x-2 bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-full">
                  <span className="text-lg">{DELIVERY_STATES[activeStateIndex]?.icon}</span>
                  <span className="text-sm font-bold text-slate-700 tracking-wide">
                    {DELIVERY_STATES[activeStateIndex]?.desc}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-sm border-dashed border-2 border-slate-300/50">
              <span className="text-6xl mb-5 opacity-40 grayscale">💤</span>
              <h3 className="text-xl font-bold text-slate-700 tracking-tight">No Active Deliveries</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-3 font-medium leading-relaxed">
                The real-time status tracker will activate here once you place a new delivery request or confirm an incoming one.
              </p>
            </div>
          )}
        </div>

        {/* ── STATS + ROBOT STATUS ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Robot Status Card */}
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 shadow-lg text-white relative overflow-hidden">
            {/* Dynamic abstract background shapes */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-[60px] opacity-20 animate-pulse"></div>
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-blue-300 uppercase tracking-widest block mb-4">OfficeMate Robot Status</span>
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight leading-snug">
                      Ready to deliver for <br/><span className="font-bold text-white">{getFirstName(user?.name) || 'you'}</span>.
                    </h2>
                    <p className="text-sm text-slate-400 mt-2 font-medium">
                      Your robotic assistant at the {user?.department || 'Faculty'}.
                    </p>
                  </div>

                  <div className={`flex items-center space-x-2.5 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider border shadow-inner ${
                    robotStatus.status === 'Idle' ? 'bg-white/10 text-slate-200 border-white/20' :
                    robotStatus.status === 'Charging' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  }`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      robotStatus.status === 'Idle' ? 'bg-slate-300' :
                      robotStatus.status === 'Charging' ? 'bg-amber-400' : 'bg-blue-400 animate-ping'
                    }`} />
                    <span>{robotStatus.status}</span>
                  </div>
                </div>
              </div>

              {/* Info row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-10 pt-6 border-t border-white/10 text-sm">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-widest block mb-1.5">Live Location</span>
                  <p className="font-bold text-white flex items-center text-sm">
                    <span className="mr-2 text-lg">📍</span> {robotStatus.currentLocation || "Docking Station"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-widest block mb-1.5">Base Station</span>
                  <p className="font-bold text-white flex items-center text-sm">
                    <span className="mr-2 text-lg">🏠</span> Docking Station
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-widest block mb-1.5">Hardware Sync</span>
                  <p className={`font-bold flex items-center text-sm ${isRobotOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className="mr-2 text-lg">{isRobotOnline ? '🟢' : '🔴'}</span> 
                    {isRobotOnline ? 'Robot Linked' : 'Robot Offline'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Delivery Summary</h3>
            <div className="grid grid-cols-2 gap-4 my-auto">
              <div className="bg-white/60 border border-slate-200/50 p-5 rounded-3xl text-center space-y-1.5 shadow-sm">
                <span className="text-3xl block mb-2">📦</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Total</span>
                <span className="text-2xl font-bold text-slate-800">{allMyDeliveries.length}</span>
              </div>
              <div className="bg-white/60 border border-slate-200/50 p-5 rounded-3xl text-center space-y-1.5 shadow-sm">
                <span className="text-3xl block mb-2">✅</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Done</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {allMyDeliveries.filter(d => d.status === 'Completed').length}
                </span>
              </div>
              <div className="bg-white/60 border border-slate-200/50 p-5 rounded-3xl text-center space-y-1.5 col-span-2 shadow-sm flex items-center justify-between px-8">
                <div className="text-left">
                  <span className="text-2xl block mb-1">⏳</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Pending Confirm</span>
                </div>
                <span className="text-2xl font-bold text-amber-500">
                  {allMyDeliveries.filter(d => d.status === 'Requested').length}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-semibold text-center mt-5 uppercase tracking-wider">Updates every 5 seconds</div>
          </div>

        </div>

        {/* ── MAP + QUICK ACTIONS ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* SVG Map */}
          <div className="lg:col-span-2 relative">
            {!isRobotOnline && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-3xl border border-red-100 shadow-inner">
                <span className="text-4xl mb-3 opacity-80 animate-pulse">📡</span>
                <h4 className="font-bold text-red-600 text-lg tracking-tight">Robot Offline / Not Powered</h4>
              </div>
            )}
            <div className="glass-card rounded-3xl p-6 shadow-sm h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Faculty Floor Map</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-widest">Live telemetry position</p>
                </div>
              </div>

              <div className="w-full flex-1 bg-slate-100/50 rounded-3xl border border-slate-200/60 p-4 flex justify-center items-center shadow-inner overflow-hidden relative">
                {/* Decorative grid gradient */}
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                
                <svg viewBox="0 0 500 350" className="w-full max-w-[500px] h-auto relative z-10 drop-shadow-sm">
                  <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Corridors */}
                  <line x1="90" y1="80" x2="410" y2="80" stroke="#cbd5e1" strokeWidth="6" strokeDasharray="8,6" strokeLinecap="round" />
                  <line x1="90" y1="270" x2="410" y2="270" stroke="#cbd5e1" strokeWidth="6" strokeDasharray="8,6" strokeLinecap="round" />
                  <line x1="250" y1="80" x2="250" y2="270" stroke="#cbd5e1" strokeWidth="6" strokeDasharray="8,6" strokeLinecap="round" />

                  {/* Active transit animation */}
                  {animationPath && (
                    <path d={animationPath} fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="8,6"
                      className="animate-[dash_10s_linear_infinite]" strokeLinecap="round" filter="url(#glow)" />
                  )}

                  {/* IT Dept — Top Left */}
                  <g transform="translate(40,40)">
                    <rect width="100" height="80" rx="12" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
                    <text x="50" y="32" fill="#1e293b" fontSize="10" fontWeight="bold" textAnchor="middle">DEPT OF IT</text>
                    <text x="50" y="50" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">Rooms 101–102</text>
                    <text x="50" y="65" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">Lab 201</text>
                  </g>

                  {/* CT Dept — Top Right */}
                  <g transform="translate(360,40)">
                    <rect width="100" height="80" rx="12" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
                    <text x="50" y="32" fill="#1e293b" fontSize="10" fontWeight="bold" textAnchor="middle">DEPT OF CT</text>
                    <text x="50" y="50" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">Rooms 103</text>
                    <text x="50" y="65" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">Lab 202</text>
                  </g>

                  {/* Docking Station — Center (Base) */}
                  <g transform="translate(195,135)">
                    <rect width="110" height="80" rx="12" fill="#eff6ff" stroke="#60a5fa" strokeWidth="2" />
                    <text x="55" y="30" fill="#1d4ed8" fontSize="10" fontWeight="bold" textAnchor="middle">BASE STATION</text>
                    <text x="55" y="48" fill="#3b82f6" fontSize="8" fontWeight="700" textAnchor="middle">🏠 Docking Station</text>
                    <text x="55" y="63" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">Charging Dock</text>
                  </g>

                  {/* IDS Dept — Bottom Left */}
                  <g transform="translate(40,230)">
                    <rect width="100" height="80" rx="12" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
                    <text x="50" y="32" fill="#1e293b" fontSize="10" fontWeight="bold" textAnchor="middle">DEPT OF IDS</text>
                    <text x="50" y="50" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">Room 104</text>
                    <text x="50" y="65" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">Lab 203</text>
                  </g>

                  {/* Common Areas — Bottom Right */}
                  <g transform="translate(360,230)">
                    <rect width="100" height="80" rx="12" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
                    <text x="50" y="32" fill="#1e293b" fontSize="10" fontWeight="bold" textAnchor="middle">COMMON</text>
                    <text x="50" y="50" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">Lecture Halls</text>
                    <text x="50" y="65" fill="#64748b" fontSize="8" fontWeight="600" textAnchor="middle">Staff Room</text>
                  </g>

                  {/* Robot dot */}
                  {animationPath ? (
                    <g filter="url(#glow)">
                      <circle r="10" fill="#2563eb" stroke="#fff" strokeWidth="2">
                        <animateMotion dur="6s" repeatCount="indefinite" path={animationPath} />
                      </circle>
                      <circle r="4" fill="#34d399">
                        <animateMotion dur="6s" repeatCount="indefinite" path={animationPath} />
                      </circle>
                    </g>
                  ) : (
                    <g transform={`translate(${robotCoords.x}, ${robotCoords.y})`} filter="url(#glow)">
                      <circle r="12" fill="#4f46e5" className="animate-ping opacity-50" />
                      <circle r="10" fill="#4f46e5" stroke="#fff" strokeWidth="2" />
                      <circle r="4" fill="#34d399" />
                    </g>
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Quick Actions</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-widest">Recommended Shortcuts</p>
            </div>

            <div className="grid grid-cols-2 gap-3 my-6">
              <button
                onClick={() => navigate('/user/create-delivery')}
                className="col-span-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-sm flex items-center justify-center gap-2"
              >
                <span className="text-xl drop-shadow-md">🚀</span> New Delivery Request
              </button>
              
              <button
                onClick={() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }}
                className="py-3 px-2 bg-white/80 border border-slate-200/80 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-[11px] uppercase tracking-wider active:scale-[0.98] flex flex-col items-center justify-center gap-1 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">📜</span>
                <span>View History</span>
              </button>
              
              <button
                onClick={() => navigate('/user/profile')}
                className="py-3 px-2 bg-white/80 border border-slate-200/80 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-[11px] uppercase tracking-wider active:scale-[0.98] flex flex-col items-center justify-center gap-1 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">👤</span>
                <span>My Profile</span>
              </button>
            </div>
          </div>

        </div>

        {/* ── DELIVERIES TABLE ──────────────────────────────────── */}
        <div className="glass-card rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Delivery History</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-widest">Sent and received logs</p>
            </div>
            <span className="text-xs bg-slate-100/80 text-slate-500 border border-slate-200 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest">
              {allMyDeliveries.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 text-slate-500 font-bold uppercase tracking-widest text-xs">
                  <th className="py-4 pl-3">Ref ID</th>
                  <th className="py-4">Sender</th>
                  <th className="py-4">Recipient</th>
                  <th className="py-4">Contents</th>
                  <th className="py-4 text-center">Live Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-slate-600">
                {allMyDeliveries.length > 0 ? (
                  allMyDeliveries.map((d) => {
                    const stateIdx = getStateIndex(d.status);
                    return (
                      <tr key={d._id} className="hover:bg-white/60 transition-colors">
                        <td className="py-5 pl-3 font-bold text-slate-500 text-xs tracking-wider">
                          {d._id?.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-5 font-semibold text-slate-700">{d.employeeId?.name || '—'}</td>
                        <td className="py-5 font-semibold text-slate-700">{d.recipientName || '—'}</td>
                        <td className="py-5 font-bold text-slate-800">{d.description || 'Documents'}</td>
                        <td className="py-5 text-center">
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border shadow-sm ${
                            d.status === 'Completed'            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            d.status === 'Cancelled'            ? 'bg-red-50 text-red-600 border-red-200' :
                            d.status === 'Awaiting Pickup'      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse' :
                            d.status === 'Requested'            ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                          }`}>
                            <span className="mr-1 text-sm">{DELIVERY_STATES[stateIdx]?.icon}</span> {d.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-sm">
                      <span className="text-3xl block mb-2 opacity-50 grayscale">📭</span>
                      No deliveries yet. Click "New Delivery Request" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
