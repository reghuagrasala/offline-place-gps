/* Your Place Data - Offline GPS v12.4 - Scroll Fixed + Safari Old Cache Purge */
const CACHE_NAME = 'place-data-v12-4-scroll-fixed-2026-05-13';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './README.md'
];

self.addEventListener('install', (e) => {
  console.log('[SW v12.4] Install', CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  console.log('[SW v12.4] Activate - deleting all old caches including Safari old');
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => {
        console.log('[SW v12.4] Deleting old cache', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim()).then(() => {
      // Force reload all clients to get new version
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.navigate(client.url + (client.url.includes('?') ? '&' : '?') + 'v=124');
        });
      });
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  // Always go network first for index.html to avoid Safari old cache
  if (e.request.url.includes('index.html') || e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((networkRes) => {
        if (networkRes && networkRes.ok) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return networkRes;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
