/* v12.8 STABLE - Fix Black Screen + No Reload Loop - Ultra Minimal */
const CACHE_NAME = 'place-data-v12-8-stable-black-fix';

self.addEventListener('install', (e) => {
  console.log('[SW v12.8] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[SW v12.8] Activate - clean old caches');
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => {
      if (k !== CACHE_NAME) {
        console.log('[SW v12.8] Delete', k);
        return caches.delete(k);
      }
    }))).then(() => self.clients.claim())
  );
});

// Fetch - Network first for HTML to prevent black screen from old cache
// If network fails, use cache
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          // Cache a copy for offline
          if (r.ok) {
            const clone = r.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For assets: network first, fallback cache
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
