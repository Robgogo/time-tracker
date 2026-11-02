import webpush from "web-push";
import { getSubscriptions, removeSubscriptions } from "./sheets";

// Hosts of the browser push services we're willing to send to
const PUSH_HOSTS = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
  "notify.windows.com",
];

export function isValidSubscription(sub: unknown): sub is PushSubscriptionJSON {
  const s = sub as PushSubscriptionJSON;
  if (!s?.endpoint || !s.keys?.p256dh || !s.keys?.auth) return false;
  try {
    const url = new URL(s.endpoint);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      PUSH_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
    );
  } catch {
    return false;
  }
}

function configure() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:robgogoworku@gmail.com";

  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID keys");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

// Send a notification to every stored subscription.
// Subscriptions the push service reports as gone are removed.
export async function sendToAll(payload: {
  title: string;
  body: string;
}): Promise<{ sent: number; failed: number }> {
  configure();
  const subscriptions = await getSubscriptions();
  const expired: string[] = [];
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async ({ endpoint, subscription }) => {
      if (!isValidSubscription(subscription)) {
        expired.push(endpoint);
        return;
      }
      try {
        await webpush.sendNotification(
          subscription as webpush.PushSubscription,
          JSON.stringify(payload),
          { TTL: 60 * 60 }
        );
        sent++;
      } catch (error) {
        failed++;
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          expired.push(endpoint);
        } else {
          console.error("Push error:", error);
        }
      }
    })
  );

  await removeSubscriptions(expired);
  return { sent, failed };
}
