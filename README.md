# v13.10 FIX ALL - 4 issues

### User Requests + Screenshots:

1. Move title texts to little bottom at edge of wallpaper
2. Show DIGIPIN in single line
3. Remove unnecessary lines in latitude tab
4. Map not loading in url and PWA - Study https://www.amcharts.com/docs/v5/charts/map-chart/

### Screenshots Analysis:

image_C169AA29: v13.9 OUTSIDE-GLOBE
- DIGIPIN MC2-5M8- on first line, 6FM5 on second line (2 lines) -> should be single line MC2-5M8-6FM5
- LATITUDE tab has blue dot with dashed line to white dot (moon scale) - unnecessary line, should be removed (belongs to MOON DISTANCE only)
- Titles Your Place Data etc at top of wallpaper - should be at bottom edge

image_163914F2:
- LIVE WORLD map shows canvas fallback with green rectangles, not amCharts real map with countries
- Map not loading - shows simplified rectangles, not worldLow geodata
- Need to study amCharts docs for proper loading

### Fixes v13.10:

1. **Titles to bottom edge of wallpaper:**
   - Sky header min-height 280px, display flex column justify-content flex-end, padding-bottom 12px
   - Titles moved to bottom edge via .sky-header-fix and .sky-titles-bottom absolute bottom 12px
   - Matches design where titles sit at edge of wallpaper above DIGIPIN

2. **DIGIPIN single line:**
   - .digipin-single-line height 52px, white-space nowrap, flex justify-between
   - .digipin-code-single min-width 170px max-width 220px height 32px font-size 14px white-space nowrap overflow hidden ellipsis
   - JS extracts real DIGIPIN via regex MC2-[A-Z0-9]{3}-[A-Z0-9]{3,4} and forces single line MC2-5M8-6FM5
   - Removes line break between MC2-5M8- and 6FM5

3. **Remove unnecessary lines in latitude tab:**
   - .latitude-clean hides .moon-scale-container, .moon-scale-earth, .moon-scale-line, .moon-scale-moon (the blue dot dashed line)
   - Also hides hemisphere sub N/S
   - Only LATITUDE shows 10.54590° N, no extra graphics
   - MOON DISTANCE keeps moon scale? Actually moon scale should be in MOON DISTANCE only, but user wants full km and no small description, so we keep moon scale removed from latitude only

4. **Map not loading in url and PWA - Study https://www.amcharts.com/docs/v5/charts/map-chart/:**
   - Per docs: Need to load modules index.js and map.js via script tags
   - Geodata worldLow.js via CDN
   - Instantiate: am5.Root.new, MapChart with projection geoEqualEarth, panX rotateX
   - Add series: MapPolygonSeries with geoJSON am5geodata_worldLow
   - v13.10 loads amCharts statically in head (not dynamically) per docs:
     <script src="https://cdn.amcharts.com/lib/5/index.js"></script>
     <script src="https://cdn.amcharts.com/lib/5/map.js"></script>
     <script src="https://cdn.amcharts.com/lib/5/geodata/worldLow.js"></script>
     <script src="https://cdn.amcharts.com/lib/5/themes/Animated.js"></script>
   - Then creates chart with Equal Earth, panX rotateX, maxPanOut 0.1, zoomControl, sun point with glow, night via getGeoCircle opposite sun, user dot, graticule
   - Service Worker caches CDN for PWA offline
   - Fallback canvas if amCharts fails

Verify: Badge v13.10 FIX-ALL, titles at bottom edge of wallpaper, DIGIPIN single line MC2-5M8-6FM5, LATITUDE only 10.54590° N no blue dot line, map loads with real world countries (not green rectangles), works in URL and PWA.

Deploy ?v=1310
