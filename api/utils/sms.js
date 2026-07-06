// ─────────────────────────────────────────────────────────────────
// SMS helper — Twilio wrapper for delivery notifications.
//
// Reads credentials from environment variables:
//   TWILIO_ACCOUNT_SID   (starts with "AC...")
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM_NUMBER   (your Twilio trial number, e.g. +1XXXXXXXXXX)
//
// If any of these are missing, sendSms() logs a warning and returns
// gracefully WITHOUT throwing — the same non-blocking behaviour the
// email notifications use, so a delivery request never fails just
// because SMS isn't configured.
// ─────────────────────────────────────────────────────────────────
const twilio = require('twilio');

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;

const isConfigured =
  TWILIO_ACCOUNT_SID &&
  TWILIO_ACCOUNT_SID.startsWith('AC') &&
  TWILIO_AUTH_TOKEN &&
  TWILIO_FROM_NUMBER;

// Create the client once at module load (only if configured).
const client = isConfigured
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

/**
 * Send an SMS. Never throws — returns { sent: boolean, ... }.
 * @param {string} to    Recipient phone in E.164 format, e.g. "+9477XXXXXXX"
 * @param {string} body  Message text
 */
async function sendSms(to, body) {
  if (!isConfigured) {
    console.warn('[SMS] Twilio not configured (missing TWILIO_* env vars) — skipping SMS.');
    return { sent: false, reason: 'not_configured' };
  }
  if (!to) {
    console.warn('[SMS] No recipient phone number provided — skipping SMS.');
    return { sent: false, reason: 'no_recipient' };
  }

  try {
    const msg = await client.messages.create({
      from: TWILIO_FROM_NUMBER,
      to,
      body,
    });
    console.log(`[SMS] Sent to ${to} (sid: ${msg.sid})`);
    return { sent: true, sid: msg.sid };
  } catch (err) {
    // Common trial-account error: recipient number not verified.
    console.error(`[SMS] Failed to send to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendSms, smsConfigured: isConfigured };
