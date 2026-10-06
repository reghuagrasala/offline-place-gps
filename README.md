# Your Place Data

Real-time GPS metrics, DIGIPIN (India Post), Sky / Astronomy data and a live Day/Night world map.

**Works online + partially offline** as a Progressive Web App.

## Features

- **GPS Metrics** (2-column metallic cards matching the original design)
  - DIGIPIN (client-side, fully offline)
  - Longitude / Latitude
  - Elevation
  - Heading – tap the card to activate live DeviceOrientation compass (short glowing green arrow)
  - Accuracy
  - Date / Time
- **Day / Night Map** – canvas-based terminator (offline capable)
- **Sky Data**
  - Current Moon (phase + illumination + size)
  - Sunrise / Sunset
  - Moonrise / Moonset
  - Moon Phase
  - Day Length
  - Solar Noon
  - Sun Altitudes
- **Sky Events** – horizontal scroll of current-period events
- **PWA**
  - Installable
  - Service Worker with cache-first for assets + network-first for live data
  - Last-known GPS & sky data stored in localStorage for offline use
  - Periodic update support when online


## Flight mode / Travel / Abroad

The app is designed to remain useful with zero network:

- **Heading / Compass** – fully live via device sensors (works in airplane mode)
- **Last GPS fix** – kept and shown (many aircraft allow GPS near windows)
- **DIGIPIN** – works only inside India; shows “OUTSIDE INDIA” when travelling abroad
- **Moon phase, illumination, size** – pure math, always live
- **Sunrise / Sunset / Day length / Solar noon** – calculated on-device for any location on Earth
- **Day/Night map** – terminator moves with real sun position offline
- **Date & Time** – device clock (respects local timezone while travelling)

Weather, reverse-geocoding and fresh event catalogues require a connection and will simply keep the last cached values until you are back online.

## Deploy to Cloudflare Pages

1. Push this repository to GitHub.
2. In Cloudflare Dashboard → Pages → Create project → Connect to Git.
3. Build settings:
   - Framework preset: None
   - Build command: (leave empty)
   - Build output directory: `/` (or root)
4. Deploy.

The site is 100 % static – no Node build required.

## Local testing

```bash
# Any static server
npx serve .
# or
python3 -m http.server 8080
```

Open on a phone (or desktop with sensor emulation) for best GPS + compass experience.

## Icons / Thumbnails

Place `icon-192.png` and `icon-512.png` in the `icons/` folder  
(or generate them from any 512×512 source).  

Open Graph / Twitter meta tags already point to these for rich previews and Cloudflare thumbnail generation.

## Data sources

- Geolocation API + DeviceOrientation API (client)
- DIGIPIN – pure client-side algorithm
- Open-Meteo (free, no API key) for sunrise/sunset/day length
- Client-side moon-phase approximation + cache for offline
- Canvas day/night terminator (no external map tiles required)

## Browser support

Modern mobile browsers (iOS Safari, Chrome Android).  
Heading requires a secure context (HTTPS) and user gesture on iOS.

---

Built for Cloudflare Pages · Offline-first · No backend required
