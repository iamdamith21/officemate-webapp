import { NAV_LOCATIONS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import useNavGoal from '../../hooks/useNavGoal';

/**
 * NavigatePanel — send the robot to one of the surveyed locations.
 *
 * Deliberately separate from CreateDelivery: this is plain point-to-point
 * navigation for testing the map and for recalling the robot by hand, with no
 * file, no RFID and no compartment doors involved. A real delivery goes through
 * the mission FSM instead.
 */

const TONE = {
  idle:      'text-slate-600 bg-slate-50 border-slate-200',
  sending:   'text-sky-700 bg-sky-50 border-sky-200',
  active:    'text-sky-700 bg-sky-50 border-sky-200',
  succeeded: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  aborted:   'text-rose-700 bg-rose-50 border-rose-200',
  canceled:  'text-amber-700 bg-amber-50 border-amber-200',
  error:     'text-rose-700 bg-rose-50 border-rose-200',
};

export default function NavigatePanel() {
  const { isRosConnected } = useAuth();
  const { goTo, cancel, status, target, distance, message, isBusy } = useNavGoal();

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Manual Navigation
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1">Send Robot To</h3>
        </div>
        <span
          className={`rounded-2xl border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isRosConnected
              ? 'border-emerald-200/60 bg-emerald-50 text-emerald-600'
              : 'border-slate-200 bg-slate-50 text-slate-400'
          }`}
        >
          {isRosConnected ? 'Connected' : 'Offline'}
        </span>
      </div>

      <p className="mt-1 mb-5 text-xs text-slate-500">
        Point-to-point navigation only — no file pickup, RFID or doors.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {NAV_LOCATIONS.map((loc) => {
          const isTarget = target?.id === loc.id;
          return (
            <button
              key={loc.id}
              type="button"
              disabled={!isRosConnected || isBusy}
              onClick={() => goTo(loc)}
              title={loc.note}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                isTarget && isBusy
                  ? 'border-sky-300 bg-sky-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98]'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="block text-sm font-semibold text-slate-800">
                {loc.label}
                {loc.isBase && (
                  <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    base
                  </span>
                )}
              </span>
              <span className="mt-1 block font-mono text-[11px] text-slate-500">
                x {loc.navSafe.x.toFixed(2)} &nbsp; y {loc.navSafe.y.toFixed(2)} &nbsp;{' '}
                {loc.navSafe.yaw.toFixed(0)}°
              </span>
            </button>
          );
        })}
      </div>

      {(status !== 'idle' || message) && (
        <div
          className={`mt-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm ${
            TONE[status] ?? TONE.idle
          }`}
        >
          <span>
            {message}
            {typeof distance === 'number' && (
              <span className="ml-2 font-mono text-xs opacity-80">
                {distance.toFixed(2)} m to go
              </span>
            )}
          </span>
          {isBusy && (
            <button
              type="button"
              onClick={cancel}
              className="shrink-0 rounded-lg border border-current px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider hover:opacity-80"
            >
              Stop
            </button>
          )}
        </div>
      )}

      {status === 'succeeded' && target?.dockCost > 0 && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Stopped at the approach pose, not the dock itself — {target.label}&apos;s
          surveyed spot is too close to a wall for Nav2 to enter.
        </p>
      )}
    </div>
  );
}
