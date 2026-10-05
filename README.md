# v13.9 STATIC GLOBE - Why globe rotating? Fix

### User Question: why globe rotating. Verify with https://www.amcharts.com/demos/day-and-night-world-map/

### Verification of amCharts demo (opened 2026-05-13):

- Demo title: Live Day and Night World Map
- Description: Shows where day/night right now. Glowing yellow dot marks sun overhead, darker = deeper night. Map follows sun while you watch.
- Interaction: Drag slider or press play to move time, click date to type any date, hover country, drag map sideways to turn world, up/down to move, scroll to zoom.
- Lighter band along edge of night is twilight.
- For developers: MapChart on Equal Earth projection (geoEqualEarth), panX: "rotateX" makes dragging turn sideways. maxPanOut 0.01 keeps from dragged off, minZoomLevel 0.5. Ocean MapPolygonSeries rectangle whole Earth, countries another. Sun MapPointSeries with two circle bullets larger blurred glow. Sun position from function calculates where sun overhead. Night MapPolygonSeries with three semi-transparent circles getGeoCircle() centered opposite sun: 90° covers sun set, 84° and 78° twilight.

### Key Finding:
- **NO auto rotation** - Equal Earth static, user drags to turn (panX rotateX)
- Night shading moves, sun dot moves, globe static
- Related demos: Rotating Globe is separate demo

### Our Bug v13.8:
- Had chart.animate({key: 'rotationX', from: -lon, to: -lon+360, duration: 180000, loops: Infinity}) - auto rotation 360°/180s
- This is from Rotating Globe demo, not Day/Night Map demo - WRONG

### Fix v13.9:

1. **Remove auto rotation:**
   - Deleted chart.animate rotationX loops
   - Globe static centered

2. **Match amCharts demo spec:**
   - Projection geoEqualEarth (not geoOrthographic rotating)
   - panX: "rotateX", panY: "translateY", maxPanOut 0.01, minZoomLevel 0.5
   - Ocean + countries polygon series
   - Sun point with glow (yellow dot + blurred larger)
   - Night via getGeoCircle opposite sun with 90° + twilight 84° 78°

3. **Canvas fallback static:**
   - World map static, not rotating
   - Day gradient moves with UTC, terminator line moves, sun yellow dot moves
   - Night shading opposite sun
   - User dot static at Thrissur

Verify: Badge v13.9 STATIC-GLOBE, globe does NOT rotate automatically, drag to turn, yellow sun dot moves, night shading moves, matches amCharts demo.

Deploy ?v=139
