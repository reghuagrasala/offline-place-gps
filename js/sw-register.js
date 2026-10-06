/**
 * Service Worker registration – Safari-safe
 * - Uses relative path so it works on Cloudflare Pages (root or subdirectory)
 * - Silently fails if SW is unavailable (private mode, old Safari, etc.)
 * - Never throws visible errors to the user
 */
(function () {
  if (!("serviceWorker" in navigator)) return;

  // Relative path is critical for Safari + Cloudflare Pages
  const SW_PATH = "./service-worker.js";

  window.addEventListener("load", () => {
    // Small delay helps Safari after cache clear / first visit
    setTimeout(() => {
      navigator.serviceWorker
        .register(SW_PATH, { scope: "./" })
        .then((reg) => {
          // Quiet success – no console noise in production
          // Periodic update check (Safari respects this)
          setInterval(() => {
            reg.update().catch(() => {});
          }, 60 * 60 * 1000);

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New version ready – optional: postMessage or soft reload
              }
            });
          });
        })
        .catch(() => {
          // Intentionally empty – Safari private mode, file://, or first-load race
          // App continues to work without SW
        });
    }, 300);
  });

  // Clean up any old broken registrations (helps after cache clear)
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      if (reg.scope && !reg.active) {
        reg.unregister().catch(() => {});
      }
    });
  }).catch(() => {});
})();
