const webpush = require('web-push');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:noreply@sismochat.marcolupi.net';

const pushEnabled = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (pushEnabled) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

async function sendPush(subscription, payload) {
  if (!pushEnabled) {
    console.warn('[push] VAPID keys not set, push not sent');
    return null;
  }
  return webpush.sendNotification(subscription, JSON.stringify(payload));
}

module.exports = { sendPush, pushEnabled };
