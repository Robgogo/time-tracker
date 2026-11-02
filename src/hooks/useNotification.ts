"use client";

import { useCallback, useEffect } from "react";

// Reminders are sent by the server via Web Push (see /api/reminders),
// so they arrive even when the app is closed.

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function subscribeToPush(): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  const reg = await navigator.serviceWorker.ready;
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  // Only tell the server about subscriptions it hasn't seen from this device
  if (localStorage.getItem("pushEndpoint") === subscription.endpoint) return;

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (res.ok) localStorage.setItem("pushEndpoint", subscription.endpoint);
}

export function useNotification() {
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }, []);

  // Call from a user gesture (e.g. the clock-in tap) so iOS allows the prompt
  const enableReminders = useCallback(async () => {
    try {
      if (await requestPermission()) await subscribeToPush();
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
  }, [requestPermission]);

  // Clear any reminder still showing once the user clocks out
  const clearReminders = useCallback(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: "CANCEL_REMINDER" });
    });
  }, []);

  // Keep the subscription registered if permission was granted earlier
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      subscribeToPush().catch((err) =>
        console.error("Push subscription failed:", err)
      );
    }
  }, []);

  return { enableReminders, clearReminders };
}
