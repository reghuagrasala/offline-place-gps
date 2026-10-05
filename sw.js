/* v13.8 PWA LIVE GLOBE - Works offline */
const CACHE_NAME = 'place-data-v13-9-static-globe';
const CDN_CACHE = 'place-data-cdn-v13-9';
const CDN_URLS = [
  'https://cdn.amcharts.com/lib/5/index.js',
  'https://cdn.amcharts.com/lib/5/map.js',
  'https://cdn.amcharts.com/lib/5/geodata/worldLow.js',
  'https://cdn.amcharts.com/lib/5/themes/Animated.js'
];

self.addEventListener('install', e => {
  console.log('[SW v13.8] Install - caching app + CDN');
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(['./', './index.html', './manifest.json'])),
      caches.open(CDN_CACHE).then(cache => {
        // Try to cache CDN, but don't fail if offline
        return Promise.all(
          CDN_URLS.map(url => 
            fetch(url).then(r => {
              if (r.ok) return cache.put(url, r);
            }).catch(() => console.log('[SW] CDN cache failed for', url))
          )
        );
      })
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  console.log('[SW v13.8] Activate');
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME && k !== CDN_CACHE && k.startsWith('place-data-')) {
          return caches.delete(k);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  const url = e.request.url;
  
  // CDN requests - cache first, then network
  if (url.includes('cdn.amcharts.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) {
          console.log('[SW] Serving CDN from cache', url);
          return cached;
        }
        return fetch(e.request).then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(CDN_CACHE).then(cache => cache.put(e.request, clone));
          }
          return r;
        }).catch(() => {
          console.log('[SW] CDN fetch failed, offline');
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }
  
  // App requests - network first, then cache
  if (url.startsWith(self.location.origin)) {
    if (e.request.mode === 'navigate') {
      e.respondWith(
        fetch(e.request).then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return r;
        }).catch(() => caches.match('./index.html'))
      );
      return;
    }
    
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return r;
      }).catch(() => caches.match(e.request))
    );
  }
});
