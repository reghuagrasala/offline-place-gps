/* v12.7 FRESH SW - 100% Fresh, Zero Reload Loop, Zero Dizziness */
/* This SW does NOT auto-reload, does NOT navigate clients, does NOT force update */

const CACHE_NAME = 'place-data-v12-7-fresh-2026-05-13';
const CACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install - skip waiting immediately, no cache addAll (to avoid install fail)
self.addEventListener('install', (event) => {
  console.log('[SW v12.7 FRESH] Install - fresh, no loop');
  self.skipWaiting();
});

// Activate - clean ALL old caches, claim clients, but DO NOT navigate/reload clients
self.addEventListener('activate', (event) => {
  console.log('[SW v12.7 FRESH] Activate - deleting old caches, NO navigate');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW v12.7 FRESH] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Claim clients but DO NOT force reload or navigate
      return self.clients.claim();
    })
  );
});

// Fetch - Network first for HTML (to always get fresh), cache first for assets
// NO reload logic, NO navigation loop
self.addEventListener('fetch', (event) => {
  // Only handle GET
  if (event.request.method !== 'GET') return;

  // Skip cross-origin
  if (!event.request.url.startsWith(self.location.origin)) return;

  // For navigation (HTML), go network first, no cache, to prevent old version loop
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Optionally cache a copy
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline fallback to cached index
          return caches.match('./index.html');
        })
    );
    return;
  }

  // For other assets, cache first then network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// NO message handler that triggers skipWaiting reload loop
// NO client.navigate
