
# Your Place Data - Final Deployment - Lanrat Day/Night Map + Big Moon

## What's included
- Realtime day/night map inspired by https://github.com/lanrat/day-night-map
  - Canvas pixel-level rendering with smooth twilight gradients (civil -6°, nautical -12°, astronomical -18°)
  - Solar position glowing yellow dot where sun directly overhead
  - Lunar position variable size based on distance
  - GPS red dot with white border (showloc feature)
  - Equirectangular projection, updates every 60 seconds
  - Uses SunCalc library (already included via CDN)
- Big Moon SVG tab: 160px realistic moon using Rx arc technique (known new moon Jan 6 2000, synodic 29.530588853, Rx + sweepFlag)
- Bottom exactly like screenshot: metallic light cards radius 18px, dark scrollable Sky Events cards, Clear Offline Data red button
- Heading tap activate compass preserved
- DIGIPIN dynamic correct official grid
- All results dynamic

## Deploy to Cloudflare Pages
1. Unzip this folder
2. Upload entire contents to Cloudflare Pages project root (or Workers & Pages)
3. Ensure icons folder exists with icon-192.png and icon-512.png
4. No build step needed - static PWA

## Features
- Works offline / flight mode
- GPS: navigator.geolocation.watchPosition
- Sky: SunCalc + open-meteo fallback
- Map: lanrat-inspired canvas, no amCharts dependency
- PWA: manifest.json + service-worker.js caches assets

## License
- Your PWA: your license
- lanrat/day-night-map inspiration: original GPL-3.0 - if you copy its code directly, keep GPL-3.0 LICENSE. This deployment uses original MIT rewrite inspired by its concepts.
- SunCalc: BSD
