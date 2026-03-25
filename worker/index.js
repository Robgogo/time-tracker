self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_REMINDER") {
    const delay = event.data.delay;
    setTimeout(() => {
      self.registration.showNotification("Time Tracker", {
        body: "You've been clocked in for 4 hours!",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        tag: "clock-reminder",
      });
    }, delay);
  }

  if (event.data?.type === "CANCEL_REMINDER") {
    self.registration
      .getNotifications({ tag: "clock-reminder" })
      .then((notifications) => {
        notifications.forEach((n) => n.close());
      });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
