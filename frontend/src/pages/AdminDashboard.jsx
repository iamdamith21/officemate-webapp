import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const DELIVERY_STATES = [
  { key: 'Requested',            label: 'Requested',         icon: '📋' },
  { key: 'Heading to Sender',    label: 'To Sender',         icon: '🚗' },
  { key: 'Heading to Recipient', label: 'En Route',          icon: '📦' },
  { key: 'Awaiting Pickup',      label: 'Awaiting Pickup',   icon: '⏳' },
  { key: 'Completed',            label: 'Completed',         icon: '🎉' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':            return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'Cancelled':            return 'bg-red-50 text-red-500 border-red-200';
    case 'Awaiting Pickup':      return 'bg-indigo-50 text-indigo-600 border-indigo-200 animate-pulse';
    case 'Heading to Sender':
    case 'Heading to Recipient': return 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse';
    case 'Confirmed':            return 'bg-teal-50 text-teal-600 border-teal-200';
    default:                     return 'bg-amber-50 text-amber-600 border-amber-200';
  }
};

export default function AdminDashboard() {
  const { deliveryRequests, fetchDeliveries, addNotification, isRosConnected } = useAuth();
  const [loading, setLoading] = useState(true);

  const [robotStatus, setRobotStatus] = useState({
    currentLocation: "Dean's Office",
    status: 'Idle',
    batteryLevel: 100,
  });

  const [radarAngle, setRadarAngle] = useState(0);

  const fetchRobotStatus = async () => {
    try {
      const response = await API.get('/robot/status');
      if (response.data.success) setRobotStatus(response.data.data);
    } catch { /* optional endpoint */ }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDeliveries(), fetchRobotStatus()]);
      setLoading(false);
    };
    init();

    const dataInterval = setInterval(() => { fetchDeliveries(); fetchRobotStatus(); }, 5000);
    const radarInterval = setInterval(() => setRadarAngle(prev => (prev + 3) % 360), 30);

    return () => { clearInterval(dataInterval); clearInterval(radarInterval); };
  }, []);

  // Advance state by one step via admin override
  const handleAdvanceState = async (req) => {
    const stateKeys = DELIVERY_STATES.map(s => s.key);
    const currentIdx = stateKeys.indexOf(req.status);
    if (currentIdx < 0 || currentIdx >= stateKeys.length - 1) return;

    const nextState = stateKeys[currentIdx + 1];
    try {
      await API.patch(`/deliveries/update-status/${req._id}`, { status: nextState });
      addNotification('Delivery Advanced', `Delivery #${req._id.slice(-6)} moved to: ${nextState}`);
      await fetchDeliveries();
    } catch (error) {
      alert('❌ Failed to update delivery status.');
    }
  };

  // Active transit requests
  const activeRequests = deliveryRequests.filter(d =>
    ['Heading to Sender', 'Heading to Recipient', 'Awaiting Pickup'].includes(d.status)
  );
  const pendingRequests = deliveryRequests.filter(d => d.status === 'Requested');
  const handleRobotCommand = async (command) => {
    let updatedFields = {};
    switch (command) {
      case 'PAUSE':
        updatedFields = { status: 'Idle' };
        alert('⏸️ Robot paused and holding position.');
        break;
      case 'RESUME':
        updatedFields = { status: 'Moving' };
        alert('▶️ Robot resuming task.');
        break;
      case 'EMERGENCY_STOP':
        updatedFields = { status: 'Idle', batteryLevel: robotStatus.batteryLevel };
        alert('🚨 EMERGENCY STOP — Robot has halted immediately.');
        break;
      case 'RETURN_TO_BASE':
        updatedFields = { currentLocation: "Dean's Office", status: 'Idle', batteryLevel: 100 };
        alert("🏠 Robot returning to Dean's Office (base).");
        break;
      default: return;
    }
    try {
      const res = await API.post('/robot/update', updatedFields);
      if (res.data.success) setRobotStatus(res.data.data);
    } catch { /* ignore */ }
  };

  return (
    <DashboardLayout isAdmin={true}>
      <div className="w-full space-y-8 p-1 text-slate-700">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Admin Control Panel</h1>
            <p className="text-slate-500 text-xs mt-1 uppercase font-semibold tracking-wider">
              OfficeMate Robot — Faculty of Information Technology, UoM
            </p>
          </div>
          <div className={`flex items-center space-x-2 bg-white border px-4 py-2 rounded-2xl shadow-sm ${isRosConnected ? 'border-emerald-200/60' : 'border-red-200/60'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${isRosConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isRosConnected ? 'text-emerald-600' : 'text-red-600'}`}>
              {isRosConnected ? 'System Online' : 'System Offline'}
            </span>
          </div>
        </div>

        {/* ── SECTION 1: CONTROLS & DIAGNOSTICS ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Robot Manual Controls */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Robot Controls</span>
            <h3 className="text-lg font-bold text-slate-800 mt-1 mb-5">Manual Override</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRobotCommand('PAUSE')}
                className="p-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <span>⏸️</span> <span>Pause Robot</span>
              </button>
              <button
                onClick={() => handleRobotCommand('RESUME')}
                className="p-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <span>▶️</span> <span>Resume</span>
              </button>
              <button
                onClick={() => handleRobotCommand('EMERGENCY_STOP')}
                className="p-4 bg-red-600 hover:bg-red-700 border border-red-700 text-white font-extrabold rounded-xl col-span-2 text-xs uppercase tracking-widest text-center shadow-md"
              >
                🚨 EMERGENCY STOP
              </button>
              <button
                onClick={() => handleRobotCommand('RETURN_TO_BASE')}
                className="p-3 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 col-span-2 text-xs uppercase tracking-wider text-center rounded-xl"
              >
                🏠 Return to Dean's Office
              </button>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Health</span>
            <h3 className="text-lg font-bold text-slate-800 mt-1 mb-5">Status Check</h3>
            <div className="space-y-4 text-xs font-semibold">
              {[
                { label: 'Navigation System', status: isRosConnected ? '🟢 Operational' : '🔴 Offline', colorClass: isRosConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200' },
                { label: 'Obstacle Sensors', status: isRosConnected ? '🟢 Connected' : '🔴 Disconnected', colorClass: isRosConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200' },
                { label: 'Locker Lock/Unlock', status: isRosConnected ? '🟢 Secured' : '🔴 Offline', colorClass: isRosConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">{item.label}</span>
                  <span className={`text-[10px] border px-2.5 py-0.5 rounded font-bold uppercase ${item.colorClass}`}>
                    {item.status}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Battery Level</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${robotStatus.batteryLevel > 30 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${robotStatus.batteryLevel}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{robotStatus.batteryLevel}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: STATS OVERVIEW ────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Awaiting Confirmation', value: pendingRequests.length, color: 'text-amber-600', icon: '📋' },
            { label: 'In Transit',            value: activeRequests.length,    color: 'text-blue-600',  icon: '🚗' },
            { label: 'Completed Today',       value: deliveryRequests.filter(d => d.status === 'Completed').length, color: 'text-emerald-600', icon: '🎉' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-center">
              <span className="text-2xl">{stat.icon}</span>
              <p className={`text-3xl font-black mt-2 ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── SECTION 3: DELIVERY REQUESTS QUEUE ──────────────── */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                All Delivery Requests
                {loading && <span className="text-[10px] text-slate-400 ml-2">(Updating...)</span>}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage and advance delivery states through the faculty workflow
              </p>
            </div>
            <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
              {deliveryRequests.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 pl-2">Sender</th>
                  <th className="py-3">Recipient</th>
                  <th className="py-3">Pickup Room</th>
                  <th className="py-3">Delivery Room</th>
                  <th className="py-3">Item</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {deliveryRequests.length > 0 ? (
                  deliveryRequests.map((req) => {
                    const isCompleted = req.status === 'Completed' || req.status === 'Cancelled';
                    const isConfirmed = req.status === 'Confirmed';
                    const isInProgress = ['Heading to Sender', 'Heading to Recipient', 'Awaiting Pickup'].includes(req.status);

                    return (
                      <tr key={req._id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 pl-2 font-bold text-slate-800">{req.employeeId?.name || '—'}</td>
                        <td className="py-4 text-slate-700">{req.recipientName || '—'}</td>
                        <td className="py-4 text-slate-500">{req.pickupLocation || '—'}</td>
                        <td className="py-4 text-slate-500 text-[10px] max-w-[140px] truncate">{req.deliveryDestination || '—'}</td>
                        <td className="py-4 text-slate-700 max-w-[120px] truncate">{req.description || 'Documents'}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(req.status)}`}>
                            {req.status || 'Requested'}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          {isCompleted ? (
                            <span className="text-slate-300 text-[10px]">—</span>
                          ) : isInProgress ? (
                            <button
                              onClick={() => handleAdvanceState(req)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-xl transition uppercase tracking-wider"
                            >
                              ▶ Next Step
                            </button>
                          ) : (
                            <span className="text-amber-500 text-[10px] font-semibold">Awaiting recipient</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400 uppercase tracking-wider">
                      📭 No delivery requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SECTION 4: LIVE RADAR MAP ────────────────────────── */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md">
          <h3 className="text-lg font-bold text-slate-800">Faculty Radar Map</h3>
          <p className="text-xs text-slate-400 mt-0.5">Live scan overlay showing robot surroundings and obstacle detection</p>

          <div className="bg-slate-50 rounded-2xl h-96 flex flex-col items-center justify-center border border-slate-200 shadow-inner relative overflow-hidden mt-6">
            <div className="w-[300px] h-[300px] rounded-full border border-slate-200 relative flex items-center justify-center">
              <div className="w-[200px] h-[200px] rounded-full border border-slate-200/60 flex items-center justify-center">
                <div className="w-[100px] h-[100px] rounded-full border border-slate-200/40" />
              </div>

              {/* Radar sweep */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  transform: `rotate(${radarAngle}deg)`,
                  background: 'conic-gradient(from 0deg at 50% 50%, rgba(59, 130, 246, 0.08) 0deg, transparent 90deg, transparent 360deg)'
                }}
              />

              {/* Obstacle dots */}
              <div className="absolute top-[80px] left-[75px] w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div className="absolute top-[80px] left-[75px] w-2 h-2 rounded-full bg-emerald-400" />
              <div className="absolute bottom-[90px] right-[80px] w-2 h-2 rounded-full bg-emerald-400 opacity-60" />
              <div className="absolute top-[160px] right-[50px] w-2 h-2 rounded-full bg-emerald-400 opacity-40" />

              {/* Center robot dot */}
              <div className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>

            <div className="text-center p-5 z-10 space-y-1 mt-4">
              <span className="text-slate-700 font-bold text-xs tracking-wider block">
                🏠 Base: Dean's Office · Robot: {robotStatus.currentLocation}
              </span>
              <span className="text-slate-400 text-[10px] block">
                Scan range: 12 metres &bull; Obstacle avoidance active
              </span>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}