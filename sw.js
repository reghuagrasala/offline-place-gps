/* v12.5 - Fix white gap + duplicate header + scroll + Safari old cache */
const CACHE_NAME = 'place-data-v12-5-fixed-2026-05-13';
const ASSETS = ['./','./index.html','./manifest.json','./README.md'];

self.addEventListener('install', (e) => {
  console.log('[SW v12.5] Install', CACHE_NAME);
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  console.log('[SW v12.5] Activate deleting old');
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.mode === 'navigate' || e.request.url.includes('index.html')) {
    e.respondWith(fetch(e.request).then(r => {
      if (r.ok) {
        const cl = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, cl));
      }
      return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fp = fetch(e.request).then(nr => {
        if (nr && nr.ok) {
          const cl = nr.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, cl));
        }
        return nr;
      }).catch(() => cached);
      return cached || fp;
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
