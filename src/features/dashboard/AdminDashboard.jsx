import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import API from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import useRobotStatus from '../../hooks/useRobotStatus';
import { DELIVERY_STATES } from '../../constants';
import { getStatusColor } from '../../utils/helpers';
import RobotLiveView from './RobotLiveView';
import NavigatePanel from './NavigatePanel';
import useDeliveryMission from '../../hooks/useDeliveryMission';

export default function AdminDashboard() {
  const { deliveryRequests, fetchDeliveries, addNotification, isRobotOnline, rosData, batteryValid } = useAuth();
  const [loading, setLoading] = useState(true);
  const robotStatus = useRobotStatus();
  const mission = useDeliveryMission();

  // Hand a stored delivery to the robot's mission FSM, then advance the record
  // so the two do not disagree. The status is only moved if the goal was
  // actually accepted — marking a delivery "Heading to Sender" when the robot
  // never got the mission is worse than leaving it Requested.
  const handleSendRobot = async (req) => {
    if (!mission.dispatch(req)) return;
    try {
      await API.patch(`/deliveries/update-status/${req._id}`, { status: 'Heading to Sender' });
      addNotification(
        'Robot Dispatched',
        `Robot is collecting from ${req.pickupLocation} for ${req.recipientName}.`
      );
      await fetchDeliveries();
    } catch {
      // The robot has the mission either way; only the record failed to update.
      addNotification('Robot Dispatched', 'Mission sent, but the delivery record did not update.');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchDeliveries();
      setLoading(false);
    };
    init();

    const dataInterval = setInterval(fetchDeliveries, 5000);

    return () => { clearInterval(dataInterval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch {
      alert('❌ Failed to update delivery status.');
    }
  };

  // Active transit requests
  const activeRequests = deliveryRequests.filter(d =>
    ['Heading to Sender', 'Heading to Recipient', 'Awaiting Pickup'].includes(d.status)
  );
  const pendingRequests = deliveryRequests.filter(d => d.status === 'Requested');
  const handleRobotCommand = async (command) => {
    let updatedFields;
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
      await API.post('/robot/update', updatedFields);
    } catch { /* ignore */ }
  };

  return (
    <DashboardLayout isAdmin={true}>
      <div className="w-full space-y-8 p-1 text-slate-700">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Admin Control Panel</h1>
            <p className="text-slate-500 text-xs mt-1 uppercase font-semibold tracking-wider">
              OfficeMate Robot — Faculty of Information Technology, UoM
            </p>
          </div>
          <div className={`flex items-center space-x-2.5 bg-white border px-4 py-2 rounded-2xl shadow-sm self-start sm:self-auto ${isRobotOnline ? 'border-emerald-200/60' : 'border-amber-200/60'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${isRobotOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isRobotOnline ? 'text-emerald-600' : 'text-amber-700'}`}>
              {isRobotOnline ? 'Robot Online' : 'Hardware Standby'}
            </span>
          </div>
        </div>

        {/* ── ACTIVE MISSION ───────────────────────────────────
            Shown only once a mission has been dispatched from here. The FSM
            reports its state on every transition, so this is the robot's own
            account of what it is doing — not the delivery record's guess. */}
        {mission.status !== 'idle' && (
          <div
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border px-5 py-3.5 ${
              mission.status === 'succeeded' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : mission.status === 'failed' || mission.status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800'
              : mission.status === 'canceled' ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-sky-200 bg-sky-50 text-sky-800'
            }`}
          >
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                {mission.isBusy ? 'Mission in progress' : 'Mission finished'}
              </span>
              <p className="text-sm font-semibold mt-0.5">{mission.message}</p>
              {(mission.stateName || mission.detail) && (
                <p className="text-[11px] mt-0.5 opacity-80">
                  {mission.stateName}
                  {mission.detail ? ` — ${mission.detail}` : ''}
                </p>
              )}
            </div>
            <button
              onClick={mission.isBusy ? mission.cancel : mission.reset}
              className="shrink-0 self-start sm:self-auto rounded-xl border border-current px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:opacity-80"
            >
              {mission.isBusy ? 'Cancel mission' : 'Dismiss'}
            </button>
          </div>
        )}

        {/* ── SECTION 1: CONTROLS & DIAGNOSTICS ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Robot Manual Controls */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Robot Controls</span>
            <h3 className="text-lg font-bold text-slate-800 mt-1 mb-5">Manual Override</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                disabled={!isRobotOnline}
                onClick={() => handleRobotCommand('PAUSE')}
                className={`p-3.5 border rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition ${
                  isRobotOnline
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold active:scale-[0.98]'
                    : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed opacity-60'
                }`}
              >
                <span>⏸️</span> <span>Pause Robot</span>
              </button>
              <button
                disabled={!isRobotOnline}
                onClick={() => handleRobotCommand('RESUME')}
                className={`p-3.5 border rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition ${
                  isRobotOnline
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold active:scale-[0.98]'
                    : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed opacity-60'
                }`}
              >
                <span>▶️</span> <span>Resume</span>
              </button>
              <button
                disabled={!isRobotOnline}
                onClick={() => handleRobotCommand('EMERGENCY_STOP')}
                className={`p-4 border text-white font-extrabold rounded-xl col-span-2 text-xs uppercase tracking-widest text-center shadow-md transition ${
                  isRobotOnline
                    ? 'bg-red-600 hover:bg-red-700 border-red-700 active:scale-[0.98]'
                    : 'bg-slate-400 border-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                🚨 EMERGENCY STOP
              </button>
              <button
                disabled={!isRobotOnline}
                onClick={() => handleRobotCommand('RETURN_TO_BASE')}
                className={`p-3 border col-span-2 text-xs uppercase tracking-wider text-center rounded-xl transition ${
                  isRobotOnline
                    ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-[0.98]'
                    : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed opacity-60'
                }`}
              >
                🏠 Return to Base Station
              </button>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Health</span>
            <h3 className="text-lg font-bold text-slate-800 mt-1 mb-5">Status Check</h3>
            <div className="space-y-4 text-xs font-semibold">
              {[
                { label: 'Navigation System', status: isRobotOnline ? `🟢 ${rosData.navStatus}` : '🟡 Standby', colorClass: isRobotOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' },
                { label: 'Obstacle Sensors', status: isRobotOnline ? (rosData.obstacleDist < 50 ? `🟡 ${rosData.obstacleDist.toFixed(1)}cm` : '🟢 CLEAR') : '🟡 Standby', colorClass: isRobotOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' },
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
                  {isRobotOnline && batteryValid ? (
                    <>
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${rosData.battery > 30 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}
                          style={{ width: `${Math.round(rosData.battery)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{Math.round(rosData.battery)}%</span>
                    </>
                  ) : (
                    // No power monitor is fitted on the robot yet, so it never
                    // publishes /battery_level. Say so rather than showing a
                    // made-up percentage.
                    <span className="text-[10px] border px-2.5 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-500 border-slate-200">
                      {isRobotOnline ? 'No Sensor' : 'Not Powered'}
                    </span>
                  )}
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

          {/* Mobile Card List View (Fits 100% on mobile screens — zero side scroll) */}
          <div className="block md:hidden space-y-3">
            {deliveryRequests.length > 0 ? (
              deliveryRequests.map((req) => {
                const isCompleted = req.status === 'Completed' || req.status === 'Cancelled';
                const isInProgress = ['Heading to Sender', 'Heading to Recipient', 'Awaiting Pickup'].includes(req.status);

                return (
                  <div key={req._id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">
                        From: {req.employeeId?.name || '—'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(req.status)}`}>
                        {req.status || 'Requested'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[9px] uppercase tracking-wider">Recipient</span>
                        <span className="font-bold text-slate-700">{req.recipientName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[9px] uppercase tracking-wider">Item</span>
                        <span className="font-bold text-slate-700">{req.description || 'Documents'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[9px] uppercase tracking-wider">Pickup</span>
                        <span className="text-slate-600 font-medium">{req.pickupLocation || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[9px] uppercase tracking-wider">Destination</span>
                        <span className="text-slate-600 font-medium truncate block">{req.deliveryDestination || '—'}</span>
                      </div>
                    </div>

                    {/* Same two actions as the desktop table — dispatching has
                        to be reachable on mobile too, since that is where these
                        requests are most likely to be handled. */}
                    {!isCompleted && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        {isInProgress ? (
                          <button
                            onClick={() => handleAdvanceState(req)}
                            className="w-full py-2 bg-blue-600 text-white text-[10px] font-bold rounded-xl transition uppercase tracking-wider active:scale-[0.98] shadow-sm"
                          >
                            ▶ Advance Next Step
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendRobot(req)}
                            disabled={!isRobotOnline || mission.isBusy}
                            className={`w-full py-2 text-[10px] font-bold rounded-xl transition uppercase tracking-wider shadow-sm ${
                              isRobotOnline && !mission.isBusy
                                ? 'bg-sky-600 text-white active:scale-[0.98]'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            🤖 Send Robot
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 font-bold uppercase tracking-wider text-xs">
                📭 No delivery requests found.
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
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
                            <button
                              onClick={() => handleSendRobot(req)}
                              disabled={!isRobotOnline || mission.isBusy}
                              title={
                                !isRobotOnline
                                  ? 'The robot is not connected'
                                  : mission.isBusy
                                    ? 'The robot is already on a mission'
                                    : 'Send the robot to collect and deliver this'
                              }
                              className={`px-4 py-2 text-[10px] font-bold rounded-xl transition uppercase tracking-wider ${
                                isRobotOnline && !mission.isBusy
                                  ? 'bg-sky-600 hover:bg-sky-700 text-white active:scale-[0.98]'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              🤖 Send Robot
                            </button>
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

        {/* ── SECTION 4: LIVE ROBOT VIEW ───────────────────────
            Was a decorative "Faculty Radar Map": the obstacle dots were fixed
            CSS positions and the sweep a CSS gradient — none of it came from
            the robot. Replaced with a real render of the SLAM map, live LiDAR
            returns, the localised pose and the planned route. */}
        <RobotLiveView />

        {/* ── SECTION 5: MANUAL NAVIGATION ─────────────────────
            Point-to-point navigation to the three surveyed locations, separate
            from the delivery flow: no file, no RFID, no doors. Useful for
            testing the map and for recalling the robot to base by hand. */}
        <NavigatePanel />

      </div>
    </DashboardLayout>
  );
}
