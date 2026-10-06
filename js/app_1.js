/**
 * Fixed App with Speed metric - Time half width + Speed under Accuracy
 */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const els = {
    digipin: $("#val-digipin"),
    lon: $("#val-lon"),
    lat: $("#val-lat"),
    elev: $("#val-elev"),
    heading: $("#val-heading"),
    accuracy: $("#val-accuracy"),
    date: $("#val-date"),
    time: $("#val-time"),
    speed: $("#val-speed"),
    arrow: $("#heading-arrow"),
    status: $("#status"),
    sunrise: $("#val-sunrise"),
    sunset: $("#val-sunset"),
    moonrise: $("#val-moonrise"),
    moonset: $("#val-moonset"),
    phase: $("#val-phase"),
    daylen: $("#val-daylen"),
    solarnoon: $("#val-solarnoon"),
    sunalt: $("#val-sunalt"),
    events: $("#events-container"),
    headingCard: $("#heading-card")
  };
  function updateStatus(online, msg) {
    if (!els.status) return;
    els.status.textContent = msg || (online ? "Online – live data" : "Offline / Flight mode");
    els.status.className = "status-bar " + (online ? "online" : "offline");
  }
  function formatCoord(v, type) {
    if (v == null || isNaN(v)) return "--";
    const abs = Math.abs(v).toFixed(6);
    if (type === "lat") return abs + "° " + (v >= 0 ? "N" : "S");
    if (type === "lon") return abs + "° " + (v >= 0 ? "E" : "W");
    return abs;
  }
  function formatElev(v){ if(v==null) return "--"; return Math.round(v)+" m"; }
  function formatAccuracy(v){ if(v==null) return "--"; return "± "+Math.round(v)+" m"; }
  function formatSpeed(mps){
    if(mps==null || isNaN(mps) || mps<0) return "0.0 Km/h";
    const kmh = mps * 3.6;
    return kmh.toFixed(1)+" Km/h";
  }
  function updateClock(){
    const now=new Date();
    if(els.date) els.date.textContent=now.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});
    if(els.time) els.time.textContent=now.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  }
  function setHeading(deg){
    const dir = window.GPS && GPS.getDirection ? GPS.getDirection(deg) : "";
    if(els.heading) els.heading.textContent=Math.round(deg)+"°"+(dir?" ("+dir+")":"");
    if(els.arrow) els.arrow.style.transform=`rotate(${deg}deg)`;
  }
  async function onGPSUpdate(data){
    let loc=data;
    if((!data.lat || data.error || (data.accuracy && data.accuracy>3000)) && window.FALLBACK){
      try{ const better=await FALLBACK.getLocation(data); if(better&&better.lat) loc=better; }catch(e){}
    }
    if(!loc.lat){ updateStatus(false, "Location unavailable - Thrissur fallback"); loc={lat:10.5276, lon:76.2144, accuracy:100, speed:0, source:"fallback-thrissur"}; }
    if(els.lat) els.lat.textContent=formatCoord(loc.lat,"lat");
    if(els.lon) els.lon.textContent=formatCoord(loc.lon,"lon");
    if(els.elev) els.elev.textContent=formatElev(loc.elev);
    if(els.accuracy) els.accuracy.textContent=formatAccuracy(loc.accuracy);
    if(els.speed) els.speed.textContent=formatSpeed(loc.speed);
    if(loc.lat && loc.lon && window.DIGIPIN){
      try{
        let code="";
        if(DIGIPIN.latLonToDigipin) code=DIGIPIN.latLonToDigipin(loc.lat,loc.lon);
        else if(DIGIPIN.encode) code=DIGIPIN.encode(loc.lat,loc.lon);
        if(els.digipin) els.digipin.textContent=code||"--";
      }catch(e){ if(els.digipin) els.digipin.textContent="--"; }
    }
    if(window.MAP && loc.lat && loc.lon){
      try{ if(MAP.setLocation) MAP.setLocation(loc.lat, loc.lon); }catch(e){}
    }
    loadSky(loc.lat, loc.lon);
    const srcLabel=loc.source||"gps";
    updateStatus(!String(srcLabel).includes("fallback"), "Location: "+srcLabel+" - Speed "+formatSpeed(loc.speed));
  }
  async function loadSky(lat, lon){
    let data={};
    try{
      if(window.FALLBACK && FALLBACK.getSkyAndWeather) data=await FALLBACK.getSkyAndWeather(lat,lon);
      else if(window.SKY && SKY.fetchSky) data=await SKY.fetchSky(lat,lon);
    }catch(e){ data={events:[]}; }
    if(els.sunrise) els.sunrise.textContent=data.sunrise?new Date(data.sunrise).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"--";
    if(els.sunset) els.sunset.textContent=data.sunset?new Date(data.sunset).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"--";
    if(els.moonrise) els.moonrise.textContent=data.moonrise?new Date(data.moonrise).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"--";
    if(els.moonset) els.moonset.textContent=data.moonset?new Date(data.moonset).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"--";
    if(els.phase) els.phase.textContent=data.moonPhase||"--";
    if(els.daylen) els.daylen.textContent=data.dayLength?Math.floor(data.dayLength/3600)+"h "+Math.floor((data.dayLength%3600)/60)+"m":"--";
    if(els.solarnoon) els.solarnoon.textContent=data.solarNoon?new Date(data.solarNoon).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"--";
    if(els.sunalt) els.sunalt.textContent=data.sunAltitude||"--";
    const moonContainer=document.getElementById('moon-container');
    const moonInfo=document.getElementById('moon-info');
    if(moonContainer && window.SKY && SKY.getMoonPhaseSVG){
      try{ moonContainer.innerHTML=SKY.getMoonPhaseSVG(new Date(),160); }catch(e){}
    }
    if(moonInfo){
      const pct=data.moonFraction!=null?(data.moonFraction*100).toFixed(1):"--";
      moonInfo.innerHTML=`<div style="font-weight:800;color:#111;">${data.moonPhase||"--"}</div><div style="font-size:11px;">${pct}%</div>`;
    }
    if(els.events && data.events){
      els.events.innerHTML=data.events.map(e=>`<div class="event-card"><div class="title">${e.title}</div><div class="date">${e.date}</div><div class="desc">${e.desc}</div></div>`).join("");
    }
  }
  function setupHeading(){
    if(!els.headingCard) return;
    els.headingCard.addEventListener("click", ()=>{
      if(window.GPS && GPS.requestHeading){
        GPS.requestHeading((deg,err)=>{ if(!err && deg!=null) setHeading(deg); });
      }
    });
  }
  function updateWallpaper(){
    const header=document.querySelector(".header-card");
    if(!header) return;
    const h=new Date().getHours()+new Date().getMinutes()/60;
    let g;
    if(h>=5&&h<7) g="linear-gradient(160deg, #2a1a4a 0%, #ff7e5f 40%, #feb47b 70%, #87ceeb 100%)";
    else if(h>=7&&h<10) g="linear-gradient(160deg, #4facfe 0%, #00f2fe 50%, #a8e6cf 100%)";
    else if(h>=10&&h<16) g="linear-gradient(160deg, #1e90ff 0%, #87ceeb 40%, #e0f7fa 100%)";
    else if(h>=16&&h<18) g="linear-gradient(160deg, #f9d423 0%, #ff4e50 50%, #2a1a4a 100%)";
    else if(h>=18&&h<20) g="linear-gradient(160deg, #0f0c29 0%, #302b63 30%, #ff512f 60%, #dd2476 100%)";
    else g="linear-gradient(160deg, #000000 0%, #0a0a1f 40%, #1a1a2e 100%)";
    header.style.background=g;
  }
  function init(){
    updateClock(); setInterval(updateClock,1000);
    updateWallpaper(); setInterval(updateWallpaper,60000);
    if(window.MAP){ try{ MAP.init("chartdiv"); }catch(e){} }
    setupHeading();
    let gpsStarted=false;
    const gpsTimeout=setTimeout(()=>{
      if(gpsStarted) return;
      updateStatus(false, "GPS timeout - fallback");
      if(window.FALLBACK && FALLBACK.getLocation){
        FALLBACK.getLocation({}).then(loc=>{ onGPSUpdate(loc&&loc.lat?loc:{lat:10.5276, lon:76.2144, accuracy:100, speed:0, source:"timeout-fallback"}); });
      } else {
        onGPSUpdate({lat:10.5276, lon:76.2144, accuracy:100, speed:0, source:"timeout-fallback"});
      }
    }, 4000);
    try{
      if(window.GPS && GPS.startWatch){
        updateStatus(true, "Requesting GPS...");
        GPS.startWatch((data)=>{ clearTimeout(gpsTimeout); gpsStarted=true; onGPSUpdate(data); });
      } else {
        throw new Error("GPS not loaded");
      }
    }catch(e){
      clearTimeout(gpsTimeout);
      updateStatus(false, "GPS error - fallback");
      onGPSUpdate({lat:10.5276, lon:76.2144, accuracy:100, speed:0, source:"catch-fallback"});
    }
  }
  document.addEventListener("DOMContentLoaded", ()=>{ init(); if(window.DETAIL&&DETAIL.init) DETAIL.init(); });
})();
