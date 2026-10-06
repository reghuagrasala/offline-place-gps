
// amCharts 5 Day and Night World Map - replaces unclear globe
// Based on https://www.amcharts.com/demos/day-and-night-world-map/
// This map shows where on Earth it's day and where it's night right now. The glowing yellow dot marks the spot where the sun is directly overhead, and the darker the shading, the deeper the night.

let am5Root, am5MapChart, sunSeries, nightSeries, gpsSeries;
let lastLat = 10.5276, lastLng = 76.2144;
let mapInitialized = false;

function getSunPosition(date = new Date()){
  // Calculate where sun is directly overhead - short function from amCharts demo
  // Uses day of year for declination
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const declination = -23.44 * Math.cos((360/365) * (dayOfYear + 10) * Math.PI/180);
  const timeUTC = date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600;
  // Longitude where sun is overhead: solar noon is 12 UTC at 0 lon, moves 15 deg per hour west
  const longitude = -(timeUTC * 15 - 180);
  const latitude = declination;
  return { longitude, latitude };
}

function initAmChartsMap(){
  const chartDiv = document.getElementById('chartdiv');
  if(!chartDiv) return;
  if(typeof am5 === 'undefined' || typeof am5map === 'undefined'){
    // Fallback if amCharts not loaded - show canvas fallback
    console.warn('amCharts not loaded, using fallback');
    initFallbackMap();
    return;
  }

  am5.ready(function(){
    am5Root = am5.Root.new("chartdiv");
    am5Root.setThemes([am5themes_Animated.new(am5Root)]);

    am5MapChart = am5Root.container.children.push(am5map.MapChart.new(am5Root, {
      panX: "rotateX",
      panY: "none",
      projection: am5map.geoEqualEarth(),
      maxPanOut: 0.1,
      minZoomLevel: 0.5,
      maxZoomLevel: 8,
      wheelY: "zoom",
      layout: am5Root.verticalLayout
    }));

    // Background series - ocean rectangle covering whole Earth
    const backgroundSeries = am5MapChart.series.push(am5map.MapPolygonSeries.new(am5Root, {}));
    backgroundSeries.mapPolygons.template.setAll({
      fill: am5.color(0x0b1a2a),
      stroke: am5.color(0x0b1a2a)
    });
    backgroundSeries.data.push({
      geometry: am5map.getGeoRectangle(90, 180, -90, -180)
    });

    // Country series
    const polygonSeries = am5MapChart.series.push(am5map.MapPolygonSeries.new(am5Root, {
      geoJSON: am5geodata_worldLow,
      exclude: ["AQ"]
    }));
    polygonSeries.mapPolygons.template.setAll({
      fill: am5.color(0x2d5a3d),
      stroke: am5.color(0x1a3a25),
      strokeWidth: 0.5
    });

    // Night series - 3 overlayed geo circles (90°, 84°, 78°) centered opposite sun
    nightSeries = am5MapChart.series.push(am5map.MapPolygonSeries.new(am5Root, {}));
    nightSeries.mapPolygons.template.setAll({
      fill: am5.color(0x000000),
      fillOpacity: 0.5,
      strokeOpacity: 0
    });

    // Sun series - glowing yellow dot marks spot where sun is directly overhead
    sunSeries = am5MapChart.series.push(am5map.MapPointSeries.new(am5Root, {}));
    sunSeries.bullets.push(function(){
      const container = am5.Container.new(am5Root, {});
      // Glow larger blurred circle
      const circleBlur = container.children.push(am5.Circle.new(am5Root, {
        radius: 16,
        fill: am5.color(0xffeb3b),
        fillOpacity: 0.4
      }));
      circleBlur.set("filter", "blur(8px)");
      // Core glowing yellow dot
      const circle = container.children.push(am5.Circle.new(am5Root, {
        radius: 8,
        fill: am5.color(0xffeb00),
        stroke: am5.color(0xffffff),
        strokeWidth: 1
      }));
      return am5.Bullet.new(am5Root, { sprite: container });
    });

    // GPS position series - red dot marking user's position
    gpsSeries = am5MapChart.series.push(am5map.MapPointSeries.new(am5Root, {}));
    gpsSeries.bullets.push(function(){
      const container = am5.Container.new(am5Root, {});
      const outer = container.children.push(am5.Circle.new(am5Root, {
        radius: 14,
        fill: am5.color(0xff0000),
        fillOpacity: 0.3,
        stroke: am5.color(0xff0000),
        strokeWidth: 1,
        strokeOpacity: 0.6
      }));
      const dot = container.children.push(am5.Circle.new(am5Root, {
        radius: 6,
        fill: am5.color(0xff0000),
        stroke: am5.color(0xffffff),
        strokeWidth: 2
      }));
      return am5.Bullet.new(am5Root, { sprite: container });
    });

    // Initial data
    updateSunAndNight();
    updateGpsMarker(lastLat, lastLng);

    // Update every minute - realtime
    setInterval(updateSunAndNight, 60000);

    mapInitialized = true;
  });
}

function updateSunAndNight(date = new Date()){
  if(!sunSeries || !nightSeries) return;
  const sunPos = getSunPosition(date);
  
  // Sun position
  sunSeries.data.setAll([{
    geometry: { type: "Point", coordinates: [sunPos.longitude, sunPos.latitude] }
  }]);

  // Night is opposite sun - point opposite to sun position
  const nightLon = (sunPos.longitude + 180) % 360;
  const nightLat = -sunPos.latitude;
  
  // 3 overlayed geo circles with radius in degrees: 90° covers everywhere sun has set, 84° and 78° add twilight (lighter band)
  nightSeries.data.setAll([
    { geometry: am5map.getGeoCircle({ longitude: nightLon, latitude: nightLat }, 90), fillOpacity: 0.5 },
    { geometry: am5map.getGeoCircle({ longitude: nightLon, latitude: nightLat }, 84), fillOpacity: 0.25 },
    { geometry: am5map.getGeoCircle({ longitude: nightLon, latitude: nightLat }, 78), fillOpacity: 0.15 }
  ]);

  // Update night polygon opacities
  nightSeries.mapPolygons.each((poly, idx)=>{
    if(idx===0) poly.set("fillOpacity", 0.5);
    if(idx===1) poly.set("fillOpacity", 0.25);
    if(idx===2) poly.set("fillOpacity", 0.15);
  });
}

function updateGpsMarker(lat, lng){
  lastLat = lat;
  lastLng = lng;
  if(gpsSeries){
    gpsSeries.data.setAll([{
      geometry: { type: "Point", coordinates: [lng, lat] }
    }]);
  }
}

function initFallbackMap(){
  // Fallback canvas map if amCharts fails
  const chartDiv = document.getElementById('chartdiv');
  if(!chartDiv) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'dayNightMap';
  canvas.style.width='100%';
  canvas.style.height='100%';
  chartDiv.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  function draw(){
    const w=canvas.clientWidth, h=canvas.clientHeight;
    canvas.width=w; canvas.height=h;
    ctx.fillStyle='#0b1a2a';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#2d5a3d';
    ctx.fillRect(w*0.05,h*0.15,w*0.25,h*0.35);
    ctx.fillRect(w*0.15,h*0.55,w*0.15,h*0.35);
    ctx.fillRect(w*0.45,h*0.15,w*0.15,h*0.70);
    ctx.fillRect(w*0.55,h*0.10,w*0.30,h*0.40);
    const sunPos=getSunPosition(new Date());
    const sunX=w/2+(sunPos.longitude/180)*w/2;
    const sunY=h/2-(sunPos.latitude/90)*h/2;
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.ellipse(w/2+((sunPos.longitude+180)%360-180)/180*w/2, h/2, w*0.55, h*0.55,0,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='#ffeb00';
    ctx.shadowBlur=20; ctx.shadowColor='#ffeb3b';
    ctx.beginPath(); ctx.arc(sunX,sunY,8,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    const gpsX=w/2+(lastLng/180)*w/2, gpsY=h/2-(lastLat/90)*h/2;
    ctx.fillStyle='#ff0000'; ctx.beginPath(); ctx.arc(gpsX,gpsY,6,0,Math.PI*2); ctx.fill();
  }
  draw();
  setInterval(draw,60000);
  window.updateGpsMarker=updateGpsMarker;
}

function initDayNightMap(){ initAmChartsMap(); }

// Public APIs for app.js
function setLocation(lat,lon){ updateGpsMarker(lat,lon); }
function updateGlobeMarker(lat,lon){ updateGpsMarker(lat,lon); }

window.MAP = { init: initDayNightMap, setLocation, updateGlobeMarker, initDayNightMap };
window.initDayNightMap = initDayNightMap;
window.updateGlobeMarker = updateGlobeMarker;
window.updateGpsMarker = updateGpsMarker;

// Auto init
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', initDayNightMap);
} else {
  initDayNightMap();
}
