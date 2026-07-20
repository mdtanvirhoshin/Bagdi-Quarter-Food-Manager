// Active Service Worker for PWA support
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through fetch handler to satisfy PWA installation criteria
  // without caching anything (avoiding any stale-cache or white-screen issues)
  event.respondWith(fetch(event.request));
});
