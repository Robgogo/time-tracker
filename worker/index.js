self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Time Tracker", {
      body: data.body || "Don't forget to clock out!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: "clock-reminder",
      renotify: true,
    })
  );
});

self.addEventListener("message", (event) => {
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
