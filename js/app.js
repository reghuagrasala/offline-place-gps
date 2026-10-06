
(function(){
  const $=s=>document.querySelector(s);
  const els={
    digipin: $("#val-digipin"), lon: $("#val-lon"), lat: $("#val-lat"), elev: $("#val-elev"),
    heading: $("#val-heading"), accuracy: $("#val-accuracy"), date: $("#val-date"), time: $("#val-time"),
    speed: $("#val-speed"), arrow: $("#heading-arrow"), status: $("#status"),
    sunrise: $("#val-sunrise"), sunset: $("#val-sunset"), moonrise: $("#val-moonrise"), moonset: $("#val-moonset"),
    phase: $("#val-phase"), daylen: $("#val-daylen"), solarnoon: $("#val-solarnoon"), sunalt: $("#val-sunalt"),
    events: $("#events-container"), headingCard: $("#heading-card"), moonContainer: $("#moon-container"), moonInfo: $("#moon-info")
  };
  function updateStatus(o,m){ if(!els.status) return; els.status.textContent=m||(o?"Online":"Offline"); els.status.className="status-bar "+(o?"online":"offline"); }
  function formatCoord(v,t){ if(v==null||isNaN(v)) return "--"; const a=Math.abs(v).toFixed(6); if(t==="lat") return a+"° "+(v>=0?"N":"S"); if(t==="lon") return a+"° "+(v>=0?"E":"W"); return a; }
  function formatSpeed(mps){ if(mps==null||isNaN(mps)) return "0.0 Km/h"; return (mps*3.6).toFixed(1)+" Km/h"; }
  function updateClock(){ const n=new Date(); if(els.date) els.date.textContent=n.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"}); if(els.time) els.time.textContent=n.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit",second:"2-digit"}); }
  function setHeading(d){ const dir=window.GPS&&GPS.getDirection?GPS.getDirection(d):""; if(els.heading) els.heading.textContent=Math.round(d)+"°"+(dir?" ("+dir+")":""); if(els.arrow) els.arrow.style.transform=`rotate(${d}deg)`; }
  async function onGPSUpdate(data){
    let loc=data;
    if((!data.lat||data.error||(data.accuracy&&data.accuracy>3000))&&window.FALLBACK){ try{ const b=await FALLBACK.getLocation(data); if(b&&b.lat) loc=b; }catch(e){} }
    if(!loc.lat){ loc={lat:10.5276,lon:76.2144,accuracy:100,speed:0,source:"default-thrissur"}; }
    if(els.lat) els.lat.textContent=formatCoord(loc.lat,"lat");
    if(els.lon) els.lon.textContent=formatCoord(loc.lon,"lon");
    if(els.elev) els.elev.textContent=loc.elev!=null?Math.round(loc.elev)+" m":"--";
    if(els.accuracy) els.accuracy.textContent=loc.accuracy!=null?"± "+Math.round(loc.accuracy)+" m":"--";
    if(els.speed) els.speed.textContent=formatSpeed(loc.speed);
    if(loc.lat&&loc.lon&&window.DIGIPIN){ try{ const code=DIGIPIN.latLonToDigipin(loc.lat,loc.lon); if(els.digipin) els.digipin.textContent=code; }catch(e){} }
    if(window.MAP&&loc.lat&&loc.lon){ try{ if(MAP.setLocation) MAP.setLocation(loc.lat,loc.lon); }catch(e){} }
    loadSky(loc.lat,loc.lon); updateStatus(true,"Location: "+(loc.source||"gps")+" - Speed "+formatSpeed(loc.speed));
  }
  async function loadSky(lat,lon){
    let data; try{ if(window.FALLBACK&&FALLBACK.getSkyAndWeather) data=await FALLBACK.getSkyAndWeather(lat,lon); else if(window.SKY&&SKY.fetchSky) data=await SKY.fetchSky(lat,lon); else data={events:[]}; }catch(e){ data={events:[]}; }
    if(els.sunrise) els.sunrise.textContent=data.sunrise?new Date(data.sunrise).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"--";
    if(els.sunset) els.sunset.textContent=data.sunset?new Date(data.sunset).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"--";
    if(els.moonrise) els.moonrise.textContent=data.moonrise?new Date(data.moonrise).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"--";
    if(els.moonset) els.moonset.textContent=data.moonset?new Date(data.moonset).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"--";
    if(els.phase) els.phase.textContent=data.moonPhase||"--";
    if(els.daylen) els.daylen.textContent=data.dayLength?(window.SKY&&SKY.formatDuration?SKY.formatDuration(data.dayLength):Math.floor(data.dayLength/3600)+"h"):"--";
    if(els.solarnoon) els.solarnoon.textContent=data.solarNoon?new Date(data.solarNoon).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"--";
    if(els.sunalt) els.sunalt.textContent=data.sunAltitude||"--";
    if(els.moonContainer&&window.SKY&&SKY.getMoonPhaseSVG){ try{ els.moonContainer.innerHTML=SKY.getMoonPhaseSVG(new Date(),160); }catch(e){} }
    if(els.events){ const ev=data.events||[{title:"Draconids Meteor Shower",date:"12 Oct 2026",desc:"Peak activity"},{title:"Partial Lunar Eclipse",date:"17 Oct 2026",desc:"Visible in parts of Asia"}]; els.events.innerHTML=ev.map(e=>`<div class="event-card"><div class="title">${e.title}</div><div class="date">${e.date}</div><div class="desc">${e.desc}</div></div>`).join(""); }
  }
  function setupHeading(){ if(!els.headingCard) return; els.headingCard.addEventListener("click", ()=>{ if(window.GPS&&GPS.requestHeading){ GPS.requestHeading((d,err)=>{ if(!err&&d!=null) setHeading(d); }); } }); }
  function updateWallpaper(){ const h=document.querySelector(".header-card"); if(!h) return; const now=new Date(); const hr=now.getHours()+now.getMinutes()/60; let g; if(hr>=5&&hr<7) g="linear-gradient(160deg,#2a1a4a,#ff7e5f,#feb47b,#87ceeb)"; else if(hr>=7&&hr<10) g="linear-gradient(160deg,#4facfe,#00f2fe,#a8e6cf)"; else if(hr>=10&&hr<16) g="linear-gradient(160deg,#1e90ff,#87ceeb,#e0f7fa)"; else if(hr>=16&&hr<18) g="linear-gradient(160deg,#f9d423,#ff4e50,#2a1a4a)"; else if(hr>=18&&hr<20) g="linear-gradient(160deg,#0f0c29,#302b63,#ff512f)"; else g="linear-gradient(160deg,#000,#0a0a1f,#1a1a2e)"; h.style.background=g; }
  function init(){
    updateClock(); setInterval(updateClock,1000); updateWallpaper(); setInterval(updateWallpaper,60000);
    if(window.MAP){ try{ if(document.getElementById('chartdiv')) MAP.init("chartdiv"); }catch(e){} }
    setupHeading();
    let started=false; const to=setTimeout(()=>{ if(started) return; onGPSUpdate({lat:10.5276,lon:76.2144,accuracy:100,speed:0,source:"timeout-fallback"}); },4000);
    try{ if(window.GPS&&GPS.startWatch){ updateStatus(true,"Requesting GPS..."); GPS.startWatch(d=>{ clearTimeout(to); started=true; onGPSUpdate(d); }); } else throw new Error("no GPS"); }catch(e){ clearTimeout(to); onGPSUpdate({lat:10.5276,lon:76.2144,accuracy:100,speed:0,source:"catch-fallback"}); }
    loadSky(10.5276,76.2144);
  }
  document.addEventListener("DOMContentLoaded", ()=>{ init(); if(window.DETAIL&&DETAIL.init) DETAIL.init(); });
})();
