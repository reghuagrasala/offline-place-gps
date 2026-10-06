/**
 * Service Worker – Safari & Cloudflare Pages friendly
 * Relative URLs only. Graceful offline.
 */
const CACHE_NAME = "place-data-v1.5";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/gps.js",
  "./js/digipin.js",
  "./js/detail.js",
  "./js/storage.js",
  "./js/fallback.js",
  "./js/sky.js",
  "./js/map.js",
  "./js/sw-register.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate – purge old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET
  if (req.method !== "GET") return;

  // Live API data → network first, cache fallback
  if (
    url.hostname.includes("open-meteo.com") ||
    url.hostname.includes("api.")
  ) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Everything else → cache first, network fallback
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok && url.origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          if (req.mode === "navigate") {
            return caches.match("./index.html");
          }
          return new Response("", { status: 503 });
        });
    })
  );
});

// Optional periodic sync
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-sky-gps") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((c) => c.postMessage({ type: "DATA_REFRESH" }));
      })
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
  if (event.data === "updateData") {
    self.clients.matchAll().then((clients) => {
      clients.forEach((c) => c.postMessage({ type: "DATA_REFRESH" }));
    });
  }
});
