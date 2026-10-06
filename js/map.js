// Fixed lanrat-inspired Day/Night Map - no recursive bug, realtime smooth twilight
let dayNightCanvas, dayNightCtx;
let lastLat = 10.5276, lastLng = 76.2144;
let worldMapImg = null;

function getSolarDeclination(date){
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  return -23.44 * Math.cos((360/365) * (dayOfYear + 10) * Math.PI/180);
}
function getSubsolarPoint(date=new Date()){
  const declination = getSolarDeclination(date);
  const utcHours = date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600;
  const longitude = -(utcHours * 15 - 180);
  return {lon: longitude, lat: declination};
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
function getTwilightColor(altitude){
  if(altitude > -0.833) return null;
  else if(altitude > -6){
    const t = (altitude + 0.833) / (-6 + 0.833);
    const alpha = 0.25 + t * 0.25;
    return {r:0,g:0,b:0,a:alpha};
  } else if(altitude > -12){
    const t = (altitude + 6) / -6;
    const alpha = 0.5 + t * 0.2;
    return {r:0,g:0,b:0,a:alpha};
  } else if(altitude > -18){
    const t = (altitude + 12) / -6;
    const alpha = 0.7 + t * 0.15;
    return {r:0,g:0,b:0,a:alpha};
  } else {
    return {r:0,g:0,b:0,a:0.85};
  }
}

function initDayNightMapInternal(){
  const chartDiv = document.getElementById('chartdiv');
  if(!chartDiv) return;
  dayNightCanvas = document.createElement('canvas');
  dayNightCanvas.id = 'dayNightMapCanvas';
  dayNightCanvas.style.width = '100%';
  dayNightCanvas.style.height = '100%';
  chartDiv.innerHTML = '';
  chartDiv.appendChild(dayNightCanvas);
  dayNightCtx = dayNightCanvas.getContext('2d', {willReadFrequently:true});
  worldMapImg = new Image();
  worldMapImg.crossOrigin = 'anonymous';
  worldMapImg.src = 'https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg';
  worldMapImg.onerror = () => { worldMapImg=null; resizeAndDraw(); };
  worldMapImg.onload = () => { resizeAndDraw(); };
  function resize(){
    const dpr = window.devicePixelRatio||1;
    const rect = chartDiv.getBoundingClientRect();
    dayNightCanvas.width = rect.width * dpr;
    dayNightCanvas.height = rect.height * dpr;
    dayNightCanvas.style.width = rect.width+'px';
    dayNightCanvas.style.height = rect.height+'px';
    dayNightCtx.setTransform(dpr,0,0,dpr,0,0);
    drawMap();
  }
  window.addEventListener('resize', resize);
  resize();
  setInterval(drawMap, 60000);
}

function resizeAndDraw(){
  const chartDiv = document.getElementById('chartdiv');
  if(!chartDiv||!dayNightCanvas) return;
  const rect = chartDiv.getBoundingClientRect();
  const dpr = window.devicePixelRatio||1;
  dayNightCanvas.width = rect.width*dpr;
  dayNightCanvas.height = rect.height*dpr;
  dayNightCanvas.style.width = rect.width+'px';
  dayNightCanvas.style.height = rect.height+'px';
  dayNightCtx.setTransform(dpr,0,0,dpr,0,0);
  drawMap();
}

function drawMap(){
  if(!dayNightCanvas||!dayNightCtx) return;
  const canvas=dayNightCanvas, ctx=dayNightCtx;
  const chartDiv=document.getElementById('chartdiv');
  if(!chartDiv) return;
  const w=chartDiv.clientWidth, h=chartDiv.clientHeight;
  if(w===0||h===0) return;
  ctx.clearRect(0,0,w,h);
  if(worldMapImg&&worldMapImg.complete&&worldMapImg.naturalWidth>0){
    ctx.drawImage(worldMapImg,0,0,w,h);
  } else {
    ctx.fillStyle='#1e3a5f'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#2d5a3d';
    ctx.fillRect(w*0.05,h*0.12,w*0.28,h*0.38);
    ctx.fillRect(w*0.18,h*0.52,w*0.12,h*0.38);
    ctx.fillRect(w*0.45,h*0.18,w*0.12,h*0.18);
    ctx.fillRect(w*0.48,h*0.35,w*0.12,h*0.45);
    ctx.fillRect(w*0.55,h*0.12,w*0.32,h*0.38);
    ctx.fillRect(w*0.72,h*0.68,w*0.14,h*0.14);
  }
  const now=new Date();
  const subsolar=getSubsolarPoint(now);
  try{
    const imageData=ctx.getImageData(0,0,w,h);
    const data=imageData.data;
    for(let y=0;y<h;y++){
      const lat=90-(y/h)*180;
      for(let x=0;x<w;x++){
        const lon=(x/w)*360-180;
        const alt=getSunAltitude(lat,lon,now);
        const twilight=getTwilightColor(alt);
        if(twilight){
          const idx=(y*w+x)*4;
          const alpha=twilight.a;
          data[idx]=data[idx]*(1-alpha)+twilight.r*alpha;
          data[idx+1]=data[idx+1]*(1-alpha)+twilight.g*alpha;
          data[idx+2]=data[idx+2]*(1-alpha)+twilight.b*alpha;
        }
      }
    }
    ctx.putImageData(imageData,0,0);
  }catch(e){
    // Fallback if getImageData fails due to CORS
  }
  const sunX=((subsolar.lon+180)/360)*w;
  const sunY=((90-subsolar.lat)/180)*h;
  ctx.shadowBlur=20; ctx.shadowColor='#ffeb3b'; ctx.fillStyle='rgba(255,235,59,0.4)'; ctx.beginPath(); ctx.arc(sunX,sunY,18,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
  ctx.shadowBlur=12; ctx.shadowColor='#ffeb3b'; ctx.fillStyle='#ffeb00'; ctx.beginPath(); ctx.arc(sunX,sunY,8,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();
  if(typeof SunCalc!=='undefined'){
    try{
      const moonPos=SunCalc.getMoonPosition(now,0,0);
      const moonIllum=SunCalc.getMoonIllumination(now);
      const moonLon=(moonPos.azimuth*180/Math.PI+180)%360-180;
      const moonLat=moonPos.altitude*180/Math.PI;
      const moonX=((moonLon+180+360)%360)/360*w;
      const moonY=((90-moonLat)/180)*h;
      const moonRadius=6+(moonIllum.fraction*2);
      ctx.fillStyle='rgba(200,200,210,0.6)'; ctx.beginPath(); ctx.arc(moonX,moonY,moonRadius+4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#e0e0e0'; ctx.beginPath(); ctx.arc(moonX,moonY,moonRadius,0,Math.PI*2); ctx.fill();
    }catch(e){}
  }
  const gpsX=((lastLng+180)/360)*w;
  const gpsY=((90-lastLat)/180)*h;
  ctx.shadowBlur=10; ctx.shadowColor='#ff0000'; ctx.fillStyle='rgba(255,0,0,0.3)'; ctx.beginPath(); ctx.arc(gpsX,gpsY,14,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
  ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(gpsX,gpsY,7,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ff0000'; ctx.beginPath(); ctx.arc(gpsX,gpsY,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.font='10px monospace'; ctx.fillText(`${lastLat.toFixed(2)}°, ${lastLng.toFixed(2)}°`, gpsX+12, gpsY-10);
  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(w/2,0); ctx.lineTo(w/2,h); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='10px sans-serif'; const utcStr=now.getUTCHours().toString().padStart(2,'0')+':'+now.getUTCMinutes().toString().padStart(2,'0')+' UTC'; ctx.fillText(`${utcStr} • Sun: ${subsolar.lon.toFixed(1)}°, ${subsolar.lat.toFixed(1)}° • lanrat-inspired`, 8, h-8);
}

function updateGpsMarker(lat,lng){ lastLat=lat; lastLng=lng; drawMap(); }

window.MAP={init:initDayNightMapInternal,setLocation:updateGpsMarker,updateGlobeMarker:updateGpsMarker,initDayNightMap:initDayNightMapInternal};
window.initDayNightMap=initDayNightMapInternal;
window.updateGpsMarker=updateGpsMarker;
window.setLocation=updateGpsMarker;

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', initDayNightMapInternal);
} else {
  initDayNightMapInternal();
}
