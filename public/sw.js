self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/icon-192x192.png',
        vibrate: data.vibrate || [200, 100, 200, 100, 200, 100, 200],
        data: {
          url: data.url || '/admin/bookings',
        },
      };
      event.waitUntil(self.registration.showNotification(data.title, options));
    } catch (err) {
      console.error('Push event data is not JSON:', err);
      event.waitUntil(
        self.registration.showNotification('TravelVoo Reminder', {
          body: event.data.text(),
          icon: '/icon-192x192.png',
          vibrate: [200, 100, 200],
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
