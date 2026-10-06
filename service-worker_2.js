const CACHE_NAME = "place-data-speed-overwrite-v4-v2-fixed";
const STATIC_ASSETS = ["./","./index.html","./css/styles.css","./js/app.js","./js/gps.js","./js/digipin.js","./js/detail.js","./js/storage.js","./js/fallback.js","./js/sky.js","./js/map.js","./js/sw-register.js","./manifest.json"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.hostname.includes("cdn.jsdelivr.net") || url.hostname.includes("unpkg.com")){
    event.respondWith(fetch(req).then(res=>{ const clone=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req,clone)).catch(()=>{}); return res; }).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then((cached) => {
      if(cached) return cached;
      return fetch(req).then((res) => {
        if(res.ok && url.origin === self.location.origin){
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(()=>{});
        }
        return res;
      }).catch(() => {
        if(req.mode === "navigate") return caches.match("./index.html");
        return new Response("", { status: 503 });
      });
    })
  );
});
