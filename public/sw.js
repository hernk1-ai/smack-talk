self.addEventListener("push", (event) => {
  let payload = {
    title: "LOCKT",
    body: "New update on your calls.",
    url: "/receipts",
  };

  try {
    if (event.data) {
      const data = event.data.json();
      payload = {
        title: data.title || payload.title,
        body: data.body || payload.body,
        url: data.url || payload.url,
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
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  const targetUrl = event.notification?.data?.url || "/receipts";
  event.notification.close();
  event.waitUntil(clients.openWindow(targetUrl));
});
