# Your Place Data - Offline GPS PWA v12.3

**100% Offline GPS + DIGIPIN + Sky Events - No API cost**

Live: https://offline-place-gps.pages.dev/

### What's New in v12.3 (Separate Files Build)
- **Architecture:** Switched back to separate files (`index.html`, `manifest.json`, `sw.js`) for proper GitHub deployment
- **Version Badge:** Visible `v12.3 SEPARATE-FILES` in header to verify deployment
- **Mobile Fixed:**
  - Viewport: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`
  - iOS: `apple-mobile-web-app-capable=yes`, `black-translucent`, safe-area insets
  - No sideways scroll, no pinch-zoom (`touch-action: manipulation`, `overscroll-behavior: none`)
- **Layout:** 2-column grid (gap 8px, padding 6px) - back to 2-col as requested
- **Metric Tabs:** 
  - TIME ZONE & MOON DIST same height as other tabs (110-120px), full-width `grid-column: 1/-1` filling empty right space
  - All tabs glassy ambience, rounded 18px, same size
- **Fonts:**
  - Yellow results: **Wider** 21px `scaleX 1.02 scaleY 1.05` weight 600 letter-spacing 0.3px for viewing pleasure, auto-fill 2-3 lines, no shrink/overlap
  - Tiny fonts (inside & outside tabs): **Bright white** `#FFFFFF` opacity 1 weight 600-700 + glow shadow for readability
- **Blink:** Default ON after 10s, yellow results blink, controls hidden (no `ON | Blink OFF | Update:2s` bar)
- **Sky:** 24h sky background, sky events horizontal auto-scroll every 60s, heading compass centered N badge, dark sky blue moon/stars thumbnail 600x600
- **Offline:** Service Worker `place-data-v12-3-separate` with `skipWaiting()` + `clients.claim()` + auto-delete old caches + version check

### Files
```
/
├── index.html       # Main PWA (single page app)
├── manifest.json    # PWA manifest (standalone, portrait)
├── sw.js            # Service Worker (offline cache)
├── README.md        # This file
├── icon-192.png     # Optional - add your icon
└── icon-512.png     # Optional - add your icon
```

### GitHub Deployment (Cloudflare Pages)

1. **Repo Structure:** Upload **all 4 files** to `main` branch root:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `README.md`

2. **Cloudflare Pages:**
   - Dashboard > Pages > Create project > Connect GitHub repo `offline-place-gps`
   - Build settings: Framework preset = **None**, Build command = empty, Output directory = `/` (root)
   - Deploy - Wait for green Success

3. **Verify Deployment:**
   - Open `https://offline-place-gps.pages.dev/?v=123` 
   - Check header shows **v12.3 SEPARATE-FILES**
   - Check bottom - should **NOT** show old `ON | Blink OFF | Update:2s` bar

### Mobile Fix (If Old Version Still Shows)

**iPhone:**
1. Delete PWA from home screen
2. Safari > open `https://offline-place-gps.pages.dev/?v=123`
3. If still old: Settings > Apps > Safari > Advanced > Website Data > Search `pages.dev` > Delete All
4. Reload `?v=123` - should show v12.3 badge
5. Add to Home Screen

**Android:**
Chrome > open site > 3 dots > ⓘ Info > **Clear & Reset** > Reload `?v=123`

**Why?** Old SW `place-data-v7-final-locked` cached old HTML. v12.3 SW auto-deletes all old caches on install.

### Features
- 9 Metric Tabs: Latitude, Longitude, Elevation, Heading, Accuracy, Speed, Date, Time, Time Zone, Sun/Moon events, Moon Phase
- 100% Offline - No GPS API cost, no network needed after install
- DIGIPIN Compatible
- 24H Sky Animation
- Glassmorphism UI
- PWA Installable

### Tech Stack
- Vanilla HTML/CSS/JS (no framework)
- Tailwind CSS (inline)
- Service Worker Cache API
- Geolocation API, SunCalc

### License
MIT - Free for personal use

---
**Build:** v12.3 Separate Files | 2026-05-13 | Bright White Tiny Fonts | Wider Yellow 21px | Mobile-Fixed
