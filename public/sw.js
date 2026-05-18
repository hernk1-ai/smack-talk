self.addEventListener("push", (event) => {
  let payload = {
    title: "LOCKT",
    body: "New update on your calls.",
    url: "/receipts",
    type: "generic",
    notificationId: "",
  };

  try {
    if (event.data) {
      const data = event.data.json();
      payload = {
        title: data.title || payload.title,
        body: data.body || payload.body,
        url: data.url || payload.url,
        type: data.type || payload.type,
        notificationId: data.notificationId || payload.notificationId,
      };
    }
  } catch {
    // Keep default payload.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/brand/lockt-icon.svg",
      badge: "/brand/lockt-icon.svg",
      data: { url: payload.url, type: payload.type, notificationId: payload.notificationId },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  const targetUrl = event.notification?.data?.url || "/receipts";
  event.notification.close();
  event.waitUntil(
    (async () => {
      const absoluteTarget = new URL(targetUrl, self.location.origin).href;
      const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if ("url" in client && client.url === absoluteTarget && "focus" in client) {
          await client.focus();
          return;
        }
      }
      await clients.openWindow(absoluteTarget);
    })(),
  );
});
