# v13.13 VERIFIED STABLE - All Tabs and Stability

## Build Info:
- Base: v13.10 working globe (user verified globe working)
- Size: 292434 bytes
- Date: 2026-05-13
- Badge: v13.13 VERIFIED-STABLE

## Tabs Verified:

### Main Grid Tabs (2 columns):
1. LATITUDE - 10.54590° N - clean, no blue dot dashed line
2. LONGITUDE - 76.22457° E
3. ALTITUDE - MSL approx
4. TIME ZONE - Asia/Kolkata IST
5. ACCURACY - GPS accuracy
6. SPEED - 0 km/h
7. HEADING - compass
8. SUN ALTITUDE - sun alt
9. MOON DISTANCE - 371,514 km full km single line, no sub, full width

### Special Tabs:
10. DIGIPIN - MC2-5M8-6FM5 single line compact 44px, not swollen
11. Your Place Data - titles bottom edge wallpaper, no overlap
12. LIVE WORLD DAY/NIGHT MAP - outside grid, full width, 240px, amCharts Equal Earth, no rotation, drag to turn, sun glow yellow dot, night shading, works URL + PWA
13. SKY EVENTS - Autumn Sep 22-Dec 20 live, Partial Lunar Eclipse, Autumnal Equinox

## Stability Checks:
- ✓ Root scrollable, no fixed height cutting preview
- ✓ Grid 2 columns stable
- ✓ Cards 115px min-height, 12px padding, border
- ✓ Results white #FFFFFF 20px 700
- ✓ No overlap titles
- ✓ DIGIPIN compact single line
- ✓ Latitude clean
- ✓ Moon full km
- ✓ Globe stable, PWA cached CDN
- ✓ Service Worker caches app + CDN
- ✓ Manifest valid
- ✓ Icons present

## amCharts Docs Verification:
- Studied https://www.amcharts.com/docs/v5/charts/map-chart/
- Modules: index.js + map.js + worldLow.js + Animated.js loaded statically
- MapChart: panX rotateX, panY translateY, projection geoEqualEarth, maxPanOut 0.1
- Series: MapPolygonSeries geoJSON worldLow, MapPointSeries sun + user, MapPolygonSeries night getGeoCircle
- ZoomControl per docs
- Fallback canvas if amCharts fails

## PWA:
- SW caches app + CDN
- Works URL + PWA offline after first online load
- Canvas fallback 100% offline

## Deploy:
?v=1313
