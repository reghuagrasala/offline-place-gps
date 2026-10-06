
const CACHE_NAME = "place-data-v-final-exact-1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/storage.js",
  "./js/digipin.js",
  "./js/fallback.js",
  "./js/gps.js",
  "./js/sky.js",
  "./js/map-amcharts.js",
  "./js/detail.js",
  "./js/app.js",
  "./js/sw-register.js",
  "./manifest.json"
];
self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  if(e.request.method!=="GET") return;
  const url=new URL(e.request.url);
  if(url.origin===location.origin){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
      const clone=res.clone();
      caches.open(CACHE_NAME).then(c=>c.put(e.request, clone));
      return res;
    }).catch(()=>caches.match("./index.html"))));
  }
});
