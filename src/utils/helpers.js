// ─── Shared Utility Helpers ──────────────────────────────────────

import { DELIVERY_STATES } from '../constants';

/**
 * Returns the index of a delivery status in the state machine.
 */
export const getStateIndex = (status) => {
  const idx = DELIVERY_STATES.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
};

/**
 * Extracts initials from a full name (e.g., "Jane Doe" → "JD").
 */
export const getInitials = (name) => {
  if (!name) return 'US';
  const parts = name.split(' ');
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/**
 * Returns Tailwind CSS classes for a delivery status badge.
 */
export const getStatusColor = (status) => {
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

/**
 * Validates an RFID hex string in the format "XX XX XX XX".
 */
export const isValidRfidHex = (value) => {
  return /^[0-9A-Fa-f]{2}( [0-9A-Fa-f]{2}){3}$/.test(value);
};

/**
 * Formats raw hex input into spaced pairs: "388B951A" → "38 8B 95 1A".
 */
export const formatRfidInput = (raw) => {
  // Strip everything except hex characters
  const hex = raw.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 8);
  // Insert spaces every 2 characters
  return hex.match(/.{1,2}/g)?.join(' ') || hex;
};

/**
 * Validates a phone number in E.164 format (e.g. "+94771234567").
 * Twilio requires E.164, so this is the format we store and send.
 */
export const isValidPhone = (phone) => /^\+\d{9,15}$/.test(phone);

/**
 * Normalises loose Sri Lankan phone input into E.164 (+94XXXXXXXXX).
 * Handles local "0" prefixes and "94" country codes:
 *   "0771234567"    → "+94771234567"
 *   "94771234567"   → "+94771234567"
 *   "771234567"     → "+94771234567"
 * Returns '' for empty input.
 */
export const normalizeSLPhone = (raw) => {
  if (!raw) return '';
  let digits = String(raw).replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.startsWith('94')) digits = digits.slice(2);
  digits = digits.slice(0, 9);
  return digits ? `+94${digits}` : '';
};

/**
 * Generates a random RFID hex tag like "A3 F1 9C 2D".
 */
export const generateRandomRfidHex = () => {
  const bytes = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
  );
  return bytes.join(' ');
};
