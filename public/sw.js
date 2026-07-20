// Self-destruct Service Worker to clean up old cache issues and restore app functionality
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      return self.registration.unregister();
    })
  );
});
