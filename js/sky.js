// Fixed Sky module - merged offline calc + Big Moon SVG 160px + SunCalc support
const SKY = (() => {
  const CACHE_KEY = "placeData_sky_v2";
  function toJulian(date){ return date.getTime()/86400000+2440587.5; }
  function sunPosition(date=new Date()){
    const rad=Math.PI/180;
    const day=(toJulian(date)-2451545.0);
    const g=(357.529+0.98560028*day)%360;
    const q=(280.459+0.98564736*day)%360;
    const L=(q+1.915*Math.sin(g*rad)+0.020*Math.sin(2*g*rad))%360;
    const e=23.439-0.00000036*day;
    const ra=Math.atan2(Math.cos(e*rad)*Math.sin(L*rad),Math.cos(L*rad))/rad;
    const decl=Math.asin(Math.sin(e*rad)*Math.sin(L*rad))/rad;
    return {decl,ra,L};
  }
  function approxSunTimes(lat,lon,date=new Date()){
    const rad=Math.PI/180;
    const {decl}=sunPosition(date);
    const latR=lat*rad; const declR=decl*rad;
    const cosHA=(Math.sin(-0.833*rad)-Math.sin(latR)*Math.sin(declR))/(Math.cos(latR)*Math.cos(declR));
    if(cosHA<-1||cosHA>1){ return {sunrise:null,sunset:null,dayLength:cosHA<-1?86400:0}; }
    const HA=Math.acos(cosHA)/rad;
    const utcNoon=12-lon/15;
    const sunriseUTC=utcNoon-HA/15; const sunsetUTC=utcNoon+HA/15;
    const base=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
    const sunrise=new Date(base.getTime()+sunriseUTC*3600000);
    const sunset=new Date(base.getTime()+sunsetUTC*3600000);
    const dayLength=(sunset-sunrise)/1000;
    return {sunrise,sunset,dayLength,solarNoon:new Date(base.getTime()+utcNoon*3600000)};
  }
  function moonPhase(date=new Date()){
    const knownNew=new Date(Date.UTC(2026,9,10,15,50));
    const synodic=29.530588853;
    const days=(date-knownNew)/86400000;
    const phase=((days%synodic)+synodic)%synodic/synodic;
    const illum=Math.round((1-Math.cos(phase*2*Math.PI))/2*100);
    let name;
    if(phase<0.03||phase>0.97) name="New Moon";
    else if(phase<0.22) name="Waxing Crescent";
    else if(phase<0.28) name="First Quarter";
    else if(phase<0.47) name="Waxing Gibbous";
    else if(phase<0.53) name="Full Moon";
    else if(phase<0.72) name="Waning Gibbous";
    else if(phase<0.78) name="Last Quarter";
    else name="Waning Crescent";
    return {phaseName:name,illumination:illum+"%",age:(phase*synodic).toFixed(1)+" d",phase:phase,fraction:illum/100};
  }
  function getMoonPhaseSVG(date=new Date(),size=160){
    let normalizedPhase,fraction;
    if(typeof SunCalc!=='undefined'){
      const illum=SunCalc.getMoonIllumination(date);
      normalizedPhase=illum.phase; fraction=illum.fraction;
    } else {
      const knownNewMoon=new Date(2000,0,6,18,14,0);
      const totalDays=(date.getTime()-knownNewMoon.getTime())/(1000*60*60*24);
      const phase=(totalDays/29.530588853)%1;
      normalizedPhase=phase<0?phase+1:phase;
      fraction=(1-Math.cos(normalizedPhase*2*Math.PI))/2;
    }
    let rx=0,sweepFlag=0;
    if(normalizedPhase<=0.25){ rx=50-(normalizedPhase/0.25)*50; sweepFlag=0; }
    else if(normalizedPhase<=0.5){ rx=((normalizedPhase-0.25)/0.25)*50; sweepFlag=1; }
    else if(normalizedPhase<=0.75){ rx=50-((normalizedPhase-0.5)/0.25)*50; sweepFlag=0; }
    else { rx=((normalizedPhase-0.75)/0.25)*50; sweepFlag=1; }
    const isWaxing=normalizedPhase<=0.5;
    const id=Math.random().toString(36).substr(2,5);
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 6px 16px rgba(0,0,0,0.5));">
      <defs>
        <radialGradient id="moonLight${id}" cx="0.35" cy="0.35" r="0.85">
          <stop offset="0%" stop-color="#fffef5"/><stop offset="25%" stop-color="#fff9c4"/><stop offset="60%" stop-color="#e8dcc0"/><stop offset="100%" stop-color="#c2b280"/>
        </radialGradient>
        <radialGradient id="moonDark${id}" cx="0.5" cy="0.5" r="0.7"><stop offset="0%" stop-color="#1e1e24"/><stop offset="100%" stop-color="#000000"/></radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="${isWaxing?'url(#moonDark'+id+')':'url(#moonLight'+id+')'}" stroke="#2a2a2a" stroke-width="0.5"/>
      <path d="M 50 2 A ${rx.toFixed(2)} 48 0 0 ${sweepFlag} 50 98 A 48 48 0 0 ${isWaxing?1:0} 50 2" fill="${isWaxing?'url(#moonLight'+id+')':'url(#moonDark'+id+')'}"/>
      ${fraction>0.1?`<g opacity="0.12"><circle cx="35" cy="30" r="5" fill="#000"/><circle cx="65" cy="60" r="6" fill="#000"/><circle cx="45" cy="75" r="4" fill="#000"/></g>`:''}
    </svg>`;
  }
  function getCurrentPeriodEvents(){
    return [
      {title:"Draconids Meteor Shower",date:"12 Oct 2026",desc:"Peak activity"},
      {title:"Partial Lunar Eclipse",date:"17 Oct 2026",desc:"Visible in parts of Asia"},
      {title:"Orionids Meteor Shower",date:"21-22 Oct 2026",desc:"Peak after midnight"},
      {title:"New Moon",date:"10 Oct 2026",desc:"Best for deep-sky"}
    ];
  }
  function loadCache(){ try{ const raw=localStorage.getItem(CACHE_KEY); if(!raw) return null; return JSON.parse(raw);}catch{ return null; } }
  function saveCache(data){ data.savedAt=Date.now(); try{ localStorage.setItem(CACHE_KEY,JSON.stringify(data)); }catch{} }
  async function fetchSky(lat,lon){
    const now=new Date();
    const moon=moonPhase(now);
    const sun=approxSunTimes(lat,lon,now);
    let data={
      moonPhase:moon.phaseName, moonIllumination:moon.illumination, moonFraction:moon.fraction, moonAge:moon.age,
      sunrise:sun.sunrise, sunset:sun.sunset, dayLength:sun.dayLength, solarNoon:sun.solarNoon,
      moonrise:null, moonset:null, sunAltitude:null, events:getCurrentPeriodEvents(), fromCache:false, source:"offline-calc"
    };
    if(typeof SunCalc!=='undefined'){
      try{
        const times=SunCalc.getTimes(now,lat,lon);
        const moonTimes=SunCalc.getMoonTimes(now,lat,lon);
        const moonIllum=SunCalc.getMoonIllumination(now);
        const sunPos=SunCalc.getPosition(now,lat,lon);
        data.sunrise=times.sunrise||data.sunrise;
        data.sunset=times.sunset||data.sunset;
        data.solarNoon=times.solarNoon||data.solarNoon;
        data.dayLength=times.sunrise&&times.sunset?(times.sunset-times.sunrise)/1000:data.dayLength;
        data.moonrise=moonTimes.rise||null;
        data.moonset=moonTimes.set||null;
        data.moonPhase=getMoonPhaseName(moonIllum.phase);
        data.moonFraction=moonIllum.fraction;
        data.moonIllumination=(moonIllum.fraction*100).toFixed(1)+"%";
        data.sunAltitude=(sunPos.altitude*180/Math.PI).toFixed(1)+"° alt";
        data.source="suncalc-offline";
      }catch(e){}
    }
    if(navigator.onLine){
      try{
        const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset,daylight_duration&timezone=auto`;
        const res=await fetch(url,{signal:AbortSignal.timeout(6000)});
        if(res.ok){
          const json=await res.json();
          if(json.daily){
            data.sunrise=json.daily.sunrise?.[0]?new Date(json.daily.sunrise[0]):data.sunrise;
            data.sunset=json.daily.sunset?.[0]?new Date(json.daily.sunset[0]):data.sunset;
            data.dayLength=json.daily.daylight_duration?.[0]??data.dayLength;
            data.source="open-meteo";
          }
        }
      }catch(e){}
    }
    saveCache(data);
    return data;
  }
  function getMoonPhaseName(phase){
    if(phase<0.03||phase>0.97) return 'New Moon';
    if(phase<0.22) return 'Waxing Crescent';
    if(phase<0.28) return 'First Quarter';
    if(phase<0.47) return 'Waxing Gibbous';
    if(phase<0.53) return 'Full Moon';
    if(phase<0.72) return 'Waning Gibbous';
    if(phase<0.78) return 'Last Quarter';
    return 'Waning Crescent';
  }
  function formatDuration(s){ if(s==null||isNaN(s)) return "--"; const h=Math.floor(s/3600); const m=Math.floor((s%3600)/60); return `${h}h ${m}m`; }
  return {fetchSky,loadCache,formatDuration,getMoonPhaseSVG,moonPhase,approxSunTimes,getMoonPhaseName};
})();
window.SKY=SKY;
window.getMoonPhaseSVG=SKY.getMoonPhaseSVG;
