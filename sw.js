/* v12.9 STABLE LAYOUT - Fix top blank + bottom strip - Fresh SW */
const CACHE_NAME = 'place-data-v12-9-stable-layout';

self.addEventListener('install', (e) => {
  console.log('[SW v12.9] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[SW v12.9] Activate - clean old');
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => {
      if (k !== CACHE_NAME) {
        console.log('[SW v12.9] Delete', k);
        return caches.delete(k);
      }
    }))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => {
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
