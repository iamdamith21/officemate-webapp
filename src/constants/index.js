// ─── Shared Constants ────────────────────────────────────────────
// Centralized constants used across multiple features.

export const DEPARTMENTS = [
  'Department of Information Technology',
  'Department of Computational Technology',
  'Department of Interdisciplinary Studies'
];

// ROOMS is DERIVED from NAV_LOCATIONS, further down this file — see the export
// after NAVIGABLE_ROOMS. It deliberately no longer contains the eleven invented
// labels (IT Room 101, Lecture Hall A, ...): none of them had a surveyed pose,
// so a delivery to one could be recorded and emailed but never actually driven,
// and the robot would refuse it at dispatch. Offering a destination the robot
// cannot reach is worse than not offering it.
//
// To add a room: survey it on the robot (`loc.sh save <name>`), check it with
// loccost.py, then `scripts/sync_locations.py` — it appears here automatically.

export const DELIVERY_STATES = [
  { key: 'Requested',            label: 'Requested',          icon: '📋', desc: 'Awaiting recipient confirmation' },
  { key: 'Heading to Sender',    label: 'Heading to Sender',  icon: '🚗', desc: "Robot travelling to sender's room" },
  { key: 'Heading to Recipient', label: 'En Route',           icon: '📦', desc: 'Documents loaded — heading to recipient' },
  { key: 'Awaiting Pickup',      label: 'Awaiting Pickup',    icon: '⏳', desc: 'Robot waiting — please collect documents' },
  { key: 'Completed',            label: 'Completed',          icon: '🎉', desc: 'Delivery complete — robot returning to base' },
];

// SVG floor plan room coordinates for the faculty map.
// NOTE: these are decorative PIXEL coordinates for the legacy floor-plan
// graphic — they are not map-frame metres. Real poses live in NAV_LOCATIONS.
export const ROOM_COORDS = {
  'Dean Sir Office':   { x: 250, y: 175 },
  'Room 1':            { x: 250, y: 80  },
  'Room 2':            { x: 250, y: 270 },
  "Dean's Office":     { x: 250, y: 175 },
  'IT Room 101':       { x: 90,  y: 80  },
  'IT Room 102':       { x: 90,  y: 80  },
  'IT Lab 201':        { x: 90,  y: 80  },
  'CT Room 103':       { x: 410, y: 80  },
  'CT Lab 202':        { x: 410, y: 80  },
  'IDS Room 104':      { x: 90,  y: 270 },
  'IDS Lab 203':       { x: 90,  y: 270 },
  'Lecture Hall A':    { x: 410, y: 270 },
  'Lecture Hall B':    { x: 410, y: 270 },
  'Staff Room':        { x: 250, y: 80  },
  'Conference Room':   { x: 250, y: 270 },
};

export const BASE_COORDS = ROOM_COORDS['Dean Sir Office'];

// ─── Real navigable locations (map: office_map_v2) ────────────────────────
//
// These are the ONLY three places the robot can actually drive to. Everything
// in ROOMS above is a label with no surveyed pose behind it — a delivery to one
// of those can be recorded but not executed.
//
// Surveyed 2026-07-31 by driving the robot to each spot and reading the
// map->base_footprint TF (robot repo: launchers/loc.sh save <name>). They live
// on the robot in ~/maps/locations.json keyed by map name, and `rosName` is the
// key the robot knows each one by. Send NAMES to the mission FSM; the
// coordinates are here so the app can draw them and drive Nav2 directly.
//
// `dock` and `navSafe` are now the SAME pose for all three, because the stored
// locations were relocated on the robot (2026-07-31) onto ground Nav2 will
// actually enter. `surveyedAt` keeps the original parked spot for reference.
//
// The reason they ever differed is worth keeping, because re-surveying will
// reintroduce it: parking the robot somewhere proves it FITS, not that Nav2 will
// drive there. Cells within the robot's 0.30 m circumscribed radius of an
// obstacle are lethal whatever inflation_radius says, and a single cost-0 cell
// is not enough either — RPP projects the footprint forward along the path, so a
// free cell wedged against a wall still trips "collision ahead". The original
// three measured 99 (lethal), 86 (inflated) and 0-but-no-clearance, and the
// delivery FSM navigates to the STORED pose with no snapping of its own, so
// every leg targeting them failed after three nav retries with nothing naming
// the goal as the cause.
//
// After any re-map: `tools/loccost.py` to see the costs, then
// `tools/nudge_locations.py --apply` to relocate them (restart the mission stack
// afterwards — location_manager caches these at startup). Then update this table.
export const NAV_LOCATIONS = [
  {
    id: 'dean_office',
    label: 'Dean Sir Office',
    rosName: 'base_station',
    isBase: true,
    dock:    { x: -0.145, y: 0.145, yaw: 3.3, z: 0.0287, w: 0.9996 },
    navSafe: { x: -0.145, y: 0.145, yaw: 3.3, z: 0.0287, w: 0.9996 },
    dockCost: 0,
    surveyedAt: { x: -0.490, y: -0.988 },
    note: 'Moved 0.57 m off the original spot, which was against a wall. Approach point, not a charging dock.',
  },
  {
    id: 'room_2',
    label: 'Room 2',
    rosName: 'recipient_desk',
    dock:    { x: 6.391, y: 0.366, yaw: -0.6, z: -0.0054, w: 1.0000 },
    navSafe: { x: 6.391, y: 0.366, yaw: -0.6, z: -0.0054, w: 1.0000 },
    dockCost: 0,
    surveyedAt: { x: 2.157, y: -1.666 },
    note: 'Moved 0.18 m — the original was free but had no clearance around it.',
  },
  {
    id: 'room_1',
    label: 'Room 1',
    rosName: 'sender_desk',
    dock:    { x: 2.516, y: 0.289, yaw: -2.8, z: -0.0242, w: 0.9997 },
    navSafe: { x: 2.516, y: 0.289, yaw: -2.8, z: -0.0242, w: 0.9997 },
    dockCost: 0,
    surveyedAt: { x: 1.150, y: 0.240 },
    note: 'Moved 0.30 m off the original spot for clearance.',
  },
];

// Display label -> entry, for the room dropdowns.
export const NAV_LOCATION_BY_LABEL = Object.fromEntries(
  NAV_LOCATIONS.map(l => [l.label, l])
);

// Robot-side name -> entry, for turning /mission_state detail back into a label.
export const NAV_LOCATION_BY_ROSNAME = Object.fromEntries(
  NAV_LOCATIONS.map(l => [l.rosName, l])
);

// Labels a delivery can actually be *driven* for, as opposed to merely recorded.
export const NAVIGABLE_ROOMS = NAV_LOCATIONS.map(l => l.label);

// The dropdowns' single source of truth. Defined here rather than at the top of
// the file because it depends on NAV_LOCATIONS, which sync_locations.py
// regenerates from the robot — so surveying a new location is all it takes for
// it to appear in the UI.
export const ROOMS = NAVIGABLE_ROOMS;

/**
 * Turn a stored delivery field into a NAV_LOCATIONS entry, or null.
 *
 * Needed because the two ends of a delivery are stored in different shapes:
 * `pickupLocation` is a bare room label ("Room 1"), but `deliveryDestination`
 * is a COMPOSITE built at submit time as `${department} — ${room}`. So the room
 * has to be recovered from the string before the robot can be told where to go.
 *
 * Every dash-separated segment is tried rather than assuming the room comes
 * last: the separator has been both an em dash and a plain hyphen in this
 * codebase, and a wrong split simply fails to match instead of resolving to the
 * wrong room. Returning null is meaningful — it means the delivery names a place
 * with no surveyed pose, so it can be recorded but never driven.
 */
export function resolveRosLocation(value) {
  if (!value || typeof value !== 'string') return null;
  const direct = NAV_LOCATION_BY_LABEL[value.trim()];
  if (direct) return direct;
  for (const part of value.split(/[—–|-]/)) {
    const hit = NAV_LOCATION_BY_LABEL[part.trim()];
    if (hit) return hit;
  }
  return null;
}

export const APP_VERSION = 'OfficeMate V1.0 2026';
