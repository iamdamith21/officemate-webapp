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

/**
 * Check whether a phone number is already in the Twilio account's
 * Verified Caller IDs list. Returns false on any error / not configured.
 * @param {string} phone  E.164, e.g. "+9477XXXXXXX"
 */
async function isCallerIdVerified(phone) {
  if (!client || !phone) return false;
  try {
    const list = await client.outgoingCallerIds.list({ phoneNumber: phone, limit: 1 });
    return list.length > 0;
  } catch (err) {
    console.error(`[SMS] Could not check verified status for ${phone}:`, err.message);
    return false;
  }
}

/**
 * Kick off Twilio Caller-ID verification for a number. Twilio places an
 * automated CALL to the number; the owner must answer and key in the
 * returned validationCode. (Twilio requires this human confirmation — a
 * number cannot be silently added to the verified list on a trial account.)
 *
 * Never throws. Returns one of:
 *   { started: true, validationCode: '123456' }   → tell the user to answer & enter it
 *   { started: false, alreadyVerified: true }      → nothing to do
 *   { started: false, reason: '...' }              → not configured / error
 *
 * @param {string} phone         E.164, e.g. "+9477XXXXXXX"
 * @param {string} friendlyName  Label shown in the Twilio console (e.g. staff name)
 */
async function initiateCallerIdVerification(phone, friendlyName) {
  if (!isConfigured) {
    console.warn('[SMS] Twilio not configured — skipping caller-ID verification.');
    return { started: false, reason: 'not_configured' };
  }
  if (!phone) return { started: false, reason: 'no_phone' };

  try {
    if (await isCallerIdVerified(phone)) {
      console.log(`[SMS] ${phone} is already a verified caller ID.`);
      return { started: false, alreadyVerified: true };
    }

    const vr = await client.validationRequests.create({
      friendlyName: friendlyName || phone,
      phoneNumber: phone,
    });
    console.log(`[SMS] Verification call placed to ${phone} (code: ${vr.validationCode}).`);
    return { started: true, validationCode: vr.validationCode };
  } catch (err) {
    console.error(`[SMS] Failed to start verification for ${phone}:`, err.message);
    return { started: false, reason: err.message };
  }
}

module.exports = {
  sendSms,
  isCallerIdVerified,
  initiateCallerIdVerification,
  smsConfigured: isConfigured,
};
