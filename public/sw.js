// Service Worker — Caluatnails push notifications (v2: urgent + actions + tags)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Caluatnails 💅',
    body: 'Tienes una actualización.',
    url: '/',
    urgent: false,
    tag: undefined,
    image: undefined,
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data.title = payload.title || data.title;
      data.body = payload.body || data.body;
      data.url = payload.url || '/';
      data.urgent = !!payload.urgent;
      data.tag = payload.tag;
      data.image = payload.image;
    } catch (_e) {
      const text = event.data.text();
      if (text) data.body = text;
    }
  }

  // Urgent → patrón largo, no se autocierra, prioridad alta, acciones rápidas
  // Normal → patrón corto, se autocierra
  const isUrgent = data.urgent === true;

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    image: data.image,
    vibrate: isUrgent
      ? [300, 100, 300, 100, 300, 100, 600]   // patrón largo y notorio
      : [100, 50, 100],
    requireInteraction: isUrgent,             // no desaparece sola hasta que el admin la toque
    renotify: isUrgent,                       // re-vibrar incluso si hay otra con el mismo tag
    silent: false,
    tag: data.tag || (isUrgent ? 'caluatnails-urgent' : 'caluatnails-default'),
    timestamp: Date.now(),
    data: {
      url: data.url || '/',
      urgent: isUrgent,
    },
    actions: isUrgent
      ? [
          { action: 'open', title: '👀 Ver ahora' },
          { action: 'dismiss', title: 'Cerrar' },
        ]
      : [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta en la app, foco + navegación
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client) {
            try { client.navigate(urlToOpen); } catch (_e) { /* cross-origin or similar */ }
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
