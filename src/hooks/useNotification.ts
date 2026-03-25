"use client";

import { useCallback, useEffect, useRef } from "react";
import { REMINDER_HOURS } from "@/lib/constants";

export function useNotification() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }, []);

  const scheduleReminder = useCallback(
    async (clockInTime: string) => {
      const granted = await requestPermission();
      if (!granted) return;

      // Calculate delay from clock-in time
      const [hours, minutes] = clockInTime.split(":").map(Number);
      const clockInDate = new Date();
      clockInDate.setHours(hours, minutes, 0, 0);

      const reminderTime =
        clockInDate.getTime() + REMINDER_HOURS * 60 * 60 * 1000;
      const delay = reminderTime - Date.now();

      if (delay <= 0) {
        // Already past reminder time, show immediately
        showNotification();
        return;
      }

      // Try service worker first
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({
          type: "SCHEDULE_REMINDER",
          delay,
        });
      }

      // Also set a local timer as fallback
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(showNotification, delay);
    },
    [requestPermission]
  );

  const cancelReminder = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "CANCEL_REMINDER" });
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { scheduleReminder, cancelReminder, requestPermission };
}

function showNotification() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification("Time Tracker", {
        body: `You've been clocked in for ${REMINDER_HOURS} hours!`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        tag: "clock-reminder",
      });
    });
  } else if ("Notification" in window) {
    new Notification("Time Tracker", {
      body: `You've been clocked in for ${REMINDER_HOURS} hours!`,
      icon: "/icons/icon-192x192.png",
    });
  }
}
