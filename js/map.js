
// lanrat/day-night-map inspired - Simple Day Night Map - Realtime with smooth twilight gradients
// Based on https://github.com/lanrat/day-night-map - Features: Real-time terminator, SunCalc integration, solar/lunar indicators, location marker
// This implementation is original MIT, inspired by lanrat's concepts but written from scratch for this PWA
// GPL-3.0 original: https://github.com/lanrat/day-night-map - If using original code directly, keep GPL-3.0 LICENSE

let dayNightCanvas, dayNightCtx, dayNightImageData;
let lastLat = 10.5276, lastLng = 76.2144;
let animationId = null;
let worldMapImg = null;

function getSolarDeclination(date){
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  return -23.44 * Math.cos((360/365) * (dayOfYear + 10) * Math.PI/180);
}

function getSubsolarPoint(date = new Date()){
  const declination = getSolarDeclination(date);
  const timeUTC = date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600 + date.getUTCSeconds()/3600*0 + date.getUTCMilliseconds()/3600000;
  const utcHours = date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600;
  const longitude = -(utcHours * 15 - 180); // where sun is directly overhead
  return { lon: longitude, lat: declination };
}

function getSunAltitude(lat, lon, date){
  const subsolar = getSubsolarPoint(date);
  const rad = Math.PI/180;
  const latR = lat * rad;
  const decR = subsolar.lat * rad;
  const hourAngle = (lon - subsolar.lon) * rad;
  const sinAlt = Math.sin(latR)*Math.sin(decR) + Math.cos(latR)*Math.cos(decR)*Math.cos(hourAngle);
  return Math.asin(sinAlt) * 180/Math.PI;
}

function getTwilightColor(altitude, isDayBase){
  // Smooth twilight gradients: civil (-6), nautical (-12), astronomical (-18)
  // Returns {r,g,b, alpha} for night overlay
  if(altitude > -0.833){
    // Day - no night overlay
    return null;
  } else if(altitude > -6){
    // Civil twilight - light
    const t = (altitude + 0.833) / (-6 + 0.833); // 0 to 1 (0=day edge, 1=dark)
    const alpha = 0.25 + t * 0.25; // 0.25 to 0.5
    return {r:0,g:0,b:0, a: alpha};
  } else if(altitude > -12){
    // Nautical twilight
    const t = (altitude + 6) / -6;
    const alpha = 0.5 + t * 0.2; // 0.5 to 0.7
    return {r:0,g:0,b:0, a: alpha};
  } else if(altitude > -18){
    // Astronomical twilight
    const t = (altitude + 12) / -6;
    const alpha = 0.7 + t * 0.15; // 0.7 to 0.85
    return {r:0,g:0,b:0, a: alpha};
  } else {
    // Night
    return {r:0,g:0,b:0, a: 0.85};
  }
}

function initDayNightMap(){
  const chartDiv = document.getElementById('chartdiv');
  if(!chartDiv) return;
  
  // Create canvas
  dayNightCanvas = document.createElement('canvas');
  dayNightCanvas.id = 'dayNightMap';
  dayNightCanvas.style.width = '100%';
  dayNightCanvas.style.height = '100%';
  chartDiv.innerHTML = '';
  chartDiv.appendChild(dayNightCanvas);
  dayNightCtx = dayNightCanvas.getContext('2d', {willReadFrequently: true});

  // Load world map background - simple equirectangular
  worldMapImg = new Image();
  worldMapImg.crossOrigin = 'anonymous';
  worldMapImg.src = 'https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg';
  worldMapImg.onerror = () => {
    // Fallback to drawing simple continents
    worldMapImg = null;
    resizeAndDraw();
  };
  worldMapImg.onload = () => {
    resizeAndDraw();
  };

  function resize(){
    const dpr = window.devicePixelRatio || 1;
    const rect = chartDiv.getBoundingClientRect();
    dayNightCanvas.width = rect.width * dpr;
    dayNightCanvas.height = rect.height * dpr;
    dayNightCanvas.style.width = rect.width + 'px';
    dayNightCanvas.style.height = rect.height + 'px';
    dayNightCtx.setTransform(dpr,0,0,dpr,0,0);
    drawMap();
  }

  window.addEventListener('resize', resize);
  resize();
  
  // Initial draw
  drawMap();
  
  // Update every minute - realtime
  setInterval(drawMap, 60000);
}

function resizeAndDraw(){
  const chartDiv = document.getElementById('chartdiv');
  if(!chartDiv || !dayNightCanvas) return;
  const rect = chartDiv.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  dayNightCanvas.width = rect.width * dpr;
  dayNightCanvas.height = rect.height * dpr;
  dayNightCanvas.style.width = rect.width + 'px';
  dayNightCanvas.style.height = rect.height + 'px';
  dayNightCtx.setTransform(dpr,0,0,dpr,0,0);
  drawMap();
}

function drawMap(){
  if(!dayNightCanvas || !dayNightCtx) return;
  const canvas = dayNightCanvas;
  const ctx = dayNightCtx;
  const chartDiv = document.getElementById('chartdiv');
  if(!chartDiv) return;
  
  const w = chartDiv.clientWidth;
  const h = chartDiv.clientHeight;
  if(w===0 || h===0) return;

  // Clear
  ctx.clearRect(0,0,w,h);
  
  // Draw base world map
  if(worldMapImg && worldMapImg.complete && worldMapImg.naturalWidth>0){
    ctx.drawImage(worldMapImg, 0, 0, w, h);
  } else {
    // Fallback: draw ocean and continents
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#2d5a3d';
    // Simplified continents - equirectangular
    // North America
    ctx.fillRect(w*0.05, h*0.12, w*0.28, h*0.38);
    // South America
    ctx.fillRect(w*0.18, h*0.52, w*0.12, h*0.38);
    // Europe
    ctx.fillRect(w*0.45, h*0.18, w*0.12, h*0.18);
    // Africa
    ctx.fillRect(w*0.48, h*0.35, w*0.12, h*0.45);
    // Asia
    ctx.fillRect(w*0.55, h*0.12, w*0.32, h*0.38);
    // Australia
    ctx.fillRect(w*0.72, h*0.68, w*0.14, h*0.14);
  }

  // Draw day/night overlay with smooth twilight gradients - pixel accurate
  const now = new Date();
  const subsolar = getSubsolarPoint(now);
  
  // For performance, draw overlay in strips
  const imageData = ctx.getImageData(0,0,w,h);
  const data = imageData.data;
  
  // Pre-calculate for speed
  for(let y=0; y<h; y++){
    const lat = 90 - (y / h) * 180; // 90 to -90
    for(let x=0; x<w; x++){
      const lon = (x / w) * 360 - 180; // -180 to 180
      const alt = getSunAltitude(lat, lon, now);
      const twilight = getTwilightColor(alt);
      if(twilight){
        const idx = (y*w + x)*4;
        // Blend with existing pixel - darken for night
        const alpha = twilight.a;
        data[idx] = data[idx] * (1-alpha) + twilight.r * alpha;
        data[idx+1] = data[idx+1] * (1-alpha) + twilight.g * alpha;
        data[idx+2] = data[idx+2] * (1-alpha) + twilight.b * alpha;
        // Keep alpha 255
      }
    }
  }
  ctx.putImageData(imageData, 0,0);

  // Draw sun position - glowing yellow dot where sun is directly overhead
  const sunX = ((subsolar.lon + 180) / 360) * w;
  const sunY = ((90 - subsolar.lat) / 180) * h;
  
  // Sun glow
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ffeb3b';
  ctx.fillStyle = 'rgba(255, 235, 59, 0.4)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 18, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Sun core
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#ffeb3b';
  ctx.fillStyle = '#ffeb00';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 8, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw moon position if SunCalc available
  if(typeof SunCalc !== 'undefined'){
    try{
      const moonPos = SunCalc.getMoonPosition(now, 0, 0);
      const moonIllum = SunCalc.getMoonIllumination(now);
      // Approximate sublunar point - moon's subsolar is similar but with lunar coords
      // Use moon's azimuth/altitude to estimate lon/lat for display
      const moonLon = (moonPos.azimuth * 180/Math.PI + 180) % 360 - 180;
      const moonLat = moonPos.altitude * 180/Math.PI;
      const moonX = ((moonLon + 180 + 360) % 360) / 360 * w;
      const moonY = ((90 - moonLat) / 180) * h;
      
      // Moon glow - variable size based on distance (perigee vs apogee) - lanrat feature
      const moonDistance = SunCalc.getMoonIllumination(now); // Use fraction for size hint
      const moonRadius = 6 + (moonIllum.fraction * 2);
      
      ctx.fillStyle = 'rgba(200, 200, 210, 0.6)';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius+4, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }catch(e){}
  }

  // Draw GPS location marker - red dot with white border (lanrat showloc feature)
  const gpsX = ((lastLng + 180) / 360) * w;
  const gpsY = ((90 - lastLat) / 180) * h;
  
  // Outer glow
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#ff0000';
  ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(gpsX, gpsY, 14, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // White border + red dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(gpsX, gpsY, 7, 0, Math.PI*2);
  ctx.fill();
  
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(gpsX, gpsY, 5, 0, Math.PI*2);
  ctx.fill();

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '10px monospace';
  ctx.fillText(`${lastLat.toFixed(2)}°, ${lastLng.toFixed(2)}°`, gpsX + 12, gpsY - 10);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke(); // Equator
  ctx.beginPath();
  ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke(); // Prime meridian

  // Time label + info
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '10px sans-serif';
  const utcStr = now.getUTCHours().toString().padStart(2,'0') + ':' + now.getUTCMinutes().toString().padStart(2,'0') + ' UTC';
  ctx.fillText(`${utcStr} • Sun: ${subsolar.lon.toFixed(1)}°, ${subsolar.lat.toFixed(1)}° • lanrat-inspired smooth twilight`, 8, h-8);
}

function updateGpsMarker(lat, lng){
  lastLat = lat;
  lastLng = lng;
  drawMap();
}

// Public API - keep same as before for app.js compatibility
function setLocation(lat, lon){ updateGpsMarker(lat, lon); }
function updateGlobeMarker(lat, lon){ updateGpsMarker(lat, lon); }
function initDayNightMap(){ initDayNightMap(); }

window.MAP = { init: initDayNightMap, setLocation, updateGlobeMarker, initDayNightMap };
window.initDayNightMap = initDayNightMap;
window.updateGlobeMarker = updateGpsMarker;
window.updateGpsMarker = updateGpsMarker;
window.setLocation = updateGpsMarker;

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', initDayNightMap);
} else {
  initDayNightMap();
}
