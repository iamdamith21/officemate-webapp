// ─── Shared Constants ────────────────────────────────────────────
// Centralized constants used across multiple features.

export const DEPARTMENTS = [
  'Department of Information Technology',
  'Department of Computational Technology',
  'Department of Interdisciplinary Studies'
];

// The first three are the surveyed, drivable locations — see NAV_LOCATIONS at
// the bottom of this file. The rest are labels only: they have no pose on the
// map, so a delivery to one can be recorded but never executed.
export const ROOMS = [
  'Dean Sir Office',
  'Room 1',
  'Room 2',
  'IT Room 101',
  'IT Room 102',
  'IT Lab 201',
  'CT Room 103',
  'CT Lab 202',
  'IDS Room 104',
  'IDS Lab 203',
  'Lecture Hall A',
  'Lecture Hall B',
  'Staff Room',
  'Conference Room'
];

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
// `dock` is where the robot was actually parked. `navSafe` is where Nav2 will
// agree to drive.
//
// THAT DISTINCTION IS LOAD-BEARING, and it is the whole reason there are two
// poses per location. Parking the robot somewhere proves it FITS; it does not
// make it a legal Nav2 goal. Cells within the robot's 0.30 m circumscribed
// radius of an obstacle are lethal whatever inflation_radius says. Measured
// costmap cost at the docks: Dean's 99 (lethal), Room 1 93 (heavily inflated),
// Room 2 0 (free) — so two of three docks are unreachable, and Nav2's only
// complaint is "collision ahead" from the controller, which never names the
// goal. Always send `navSafe`.
//
// Re-derive after any re-map with the robot's `tools/loccost.py`, which prints
// the cost at every saved location and the nearest cell with real clearance.
export const NAV_LOCATIONS = [
  {
    id: 'dean_office',
    label: 'Dean Sir Office',
    rosName: 'base_station',        // also delivery_manager's base_location
    isBase: true,
    dock:    { x: -0.490, y: -0.988, yaw: -3.1, z: -0.0272, w: 0.9996 },
    navSafe: { x: -0.040, y: -0.638, yaw: -3.1, z: -0.0272, w: 0.9996 },
    dockCost: 99,
    note: 'Docked against a wall — Nav2 stops 0.57 m short. Re-survey further out for true docking.',
  },
  {
    id: 'room_1',
    label: 'Room 1',
    rosName: 'sender_desk',
    dock:    { x: 1.150, y: 0.240, yaw: 89.6, z: 0.7046, w: 0.7096 },
    navSafe: { x: 1.250, y: 0.040, yaw: 89.6, z: 0.7046, w: 0.7096 },
    dockCost: 93,
    note: 'Approach pose sits ~0.22 m off the dock.',
  },
  {
    id: 'room_2',
    label: 'Room 2',
    rosName: 'recipient_desk',
    dock:    { x: 2.157, y: -1.666, yaw: -5.4, z: -0.0467, w: 0.9989 },
    navSafe: { x: 2.107, y: -1.566, yaw: -5.4, z: -0.0467, w: 0.9989 },
    dockCost: 0,
    note: 'Only dock already on free ground. Verified reached in 83 s.',
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

export const APP_VERSION = 'OfficeMate V1.0 2026';
