/* Your Place Data - Offline GPS v12.3 - Separate files build */
const CACHE_NAME = 'place-data-v12-3-separate-2026-05-13';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './README.md'
  // icons will be cached dynamically if present
];

self.addEventListener('install', (e) => {
  console.log('[SW v12.3] Install', CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  console.log('[SW v12.3] Activate', CACHE_NAME);
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => {
        console.log('[SW v12.3] Deleting old cache', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Skip chrome extensions and external APIs
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((networkRes) => {
        if (networkRes && networkRes.ok) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return networkRes;
      }).catch(() => {
        // Offline fallback
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
      return cached || fetchPromise;
    })
  );
});
