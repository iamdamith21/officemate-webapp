// ─── Shared Constants ────────────────────────────────────────────
// Centralized constants used across multiple features.

export const DEPARTMENTS = [
  'Department of Information Technology',
  'Department of Computational Technology',
  'Department of Interdisciplinary Studies'
];

export const ROOMS = [
  "Dean's Office",
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

// SVG floor plan room coordinates for the faculty map
export const ROOM_COORDS = {
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

export const BASE_COORDS = ROOM_COORDS["Dean's Office"];

export const APP_VERSION = 'OfficeMate V1.0 2026';
