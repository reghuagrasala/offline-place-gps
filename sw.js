/* v12.6 STABLE - No bounce, no auto-reload loop, no dizziness */
const CACHE_NAME = 'place-data-v12-6-stable-2026-05-13';

self.addEventListener('install', (e) => {
  console.log('[SW v12.6] Install', CACHE_NAME);
  // Don't use addAll that can fail, use cache open and skipWaiting
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  console.log('[SW v12.6] Activate - stable, deleting old caches without forced navigation');
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW v12.6] Deleting old cache', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
    // NO client.navigate loop here - that caused dizziness bounce
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  
  // For navigation, network first but NO auto reload
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html') || caches.match('/'))
    );
    return;
  }
  
  // For assets, cache first then network
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        // Don't cache if not ok
        if (!res || !res.ok) return res;
        return res;
      }).catch(() => cached);
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
