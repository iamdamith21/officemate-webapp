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
          <h3 className="text-lg font-bold text-slate-800 mt-0.5">Send Robot To Location</h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isRosConnected
              ? 'border-emerald-200/60 bg-emerald-50 text-emerald-600'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {isRosConnected ? '🟢 Connected' : '📡 Standby'}
        </span>
      </div>

      <p className="mt-1 mb-5 text-xs text-slate-500 font-medium">
        Choose a destination and the robot will drive itself there.
      </p>

      {/* Map poses are deliberately NOT rendered. They are engineering detail —
          metres in the SLAM map frame, plus a heading — and showing them invites
          the reader to treat them as room numbers. The location name is the
          contract the rest of the system uses anyway. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {NAV_LOCATIONS.map((loc) => {
          const isTarget = target?.id === loc.id;
          const isDriving = isTarget && isBusy;
          return (
            <button
              key={loc.id}
              type="button"
              disabled={!isRosConnected || isBusy}
              onClick={() => goTo(loc)}
              className={`group flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                isDriving
                  ? 'border-sky-300 bg-sky-50 ring-1 ring-sky-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span
                aria-hidden="true"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${
                  isDriving ? 'bg-sky-100' : 'bg-slate-100 group-hover:bg-slate-200'
                }`}
              >
                {loc.isBase ? '🏠' : '🚪'}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-800">
                  {loc.label}
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                  {isDriving
                    ? 'On the way…'
                    : loc.isBase
                      ? 'Base station'
                      : 'Delivery point'}
                </span>
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
              <span className="ml-2 text-xs opacity-80">
                {distance < 1 ? 'almost there' : `${distance.toFixed(1)} m to go`}
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

      {/* Worth saying, without the jargon: the robot stops a little short of
          these two because their surveyed spots are tight against a wall. Silent
          would be worse — it would read as the robot missing its destination. */}
      {status === 'succeeded' && target?.dockCost > 0 && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          The robot stopped just short of {target.label} — that spot is too close
          to a wall for it to pull all the way in.
        </p>
      )}
    </div>
  );
}
