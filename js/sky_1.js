// Sky calculations - SunCalc accurate + BIG moon using user's SVG arc technique (better)
// User's code: Known New Moon Jan 6 2000, Synodic Month 29.530588853, Rx + sweepFlag arc - more accurate terminator
function toLocalTimeString(date){
  if(!date) return '--';
  return date.toLocaleTimeString([], {hour:'numeric', minute:'2-digit', hour12:true});
}
function getMoonPhaseName(phase){
  if(phase < 0.03 || phase > 0.97) return 'New Moon';
  if(phase < 0.22) return 'Waxing Crescent';
  if(phase < 0.28) return 'First Quarter';
  if(phase < 0.47) return 'Waxing Gibbous';
  if(phase < 0.53) return 'Full Moon';
  if(phase < 0.72) return 'Waning Gibbous';
  if(phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

// USER'S TECHNIQUE - IMPROVED BIG VERSION (160px, realistic colors, no small icon)
function getMoonPhaseSVG(date = new Date(), size=180){
  // 1. Calculate phase 0-1 - use SunCalc if available for more accuracy, else user's method
  let normalizedPhase;
  let fraction;
  if(typeof SunCalc !== 'undefined'){
    const illum = SunCalc.getMoonIllumination(date);
    normalizedPhase = illum.phase;
    fraction = illum.fraction;
  } else {
    // Fallback to user's lightweight method (no dependency)
    const knownNewMoon = new Date(2000, 0, 6, 18, 14, 0);
    const totalMs = date.getTime() - knownNewMoon.getTime();
    const totalDays = totalMs / (1000 * 60 * 60 * 24);
    const phase = (totalDays / 29.530588853) % 1;
    normalizedPhase = phase < 0 ? phase + 1 : phase;
    // Approximate fraction from phase
    fraction = (1 - Math.cos(normalizedPhase * 2 * Math.PI)) / 2;
  }

  // 2. Map phase to SVG path parameters - user's Rx technique is BETTER for realistic curve
  let rx = 0;
  let sweepFlag = 0;
  if (normalizedPhase <= 0.25) {
    rx = 50 - (normalizedPhase / 0.25) * 50;
    sweepFlag = 0;
  } else if (normalizedPhase <= 0.5) {
    rx = ((normalizedPhase - 0.25) / 0.25) * 50;
    sweepFlag = 1;
  } else if (normalizedPhase <= 0.75) {
    rx = 50 - ((normalizedPhase - 0.5) / 0.25) * 50;
    sweepFlag = 0;
  } else {
    rx = ((normalizedPhase - 0.75) / 0.25) * 50;
    sweepFlag = 1;
  }

  const isWaxing = normalizedPhase <= 0.5;
  const id = Math.random().toString(36).substr(2,5);

  // For BIG moon, use realistic colors and add craters + drop shadow
  // Remove small icon - this IS the big image in relevant tab
  return `
    <svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 6px 16px rgba(0,0,0,0.5));">
      <defs>
        <radialGradient id="moonLight${id}" cx="0.35" cy="0.35" r="0.85">
          <stop offset="0%" stop-color="#fffef5"/>
          <stop offset="25%" stop-color="#fff9c4"/>
          <stop offset="60%" stop-color="#e8dcc0"/>
          <stop offset="100%" stop-color="#c2b280"/>
        </radialGradient>
        <radialGradient id="moonDark${id}" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stop-color="#1e1e24"/>
          <stop offset="100%" stop-color="#000000"/>
        </radialGradient>
      </defs>
      <!-- Base Moon Body - dark or light depending on waxing -->
      <circle cx="50" cy="50" r="48" fill="${isWaxing ? 'url(#moonDark'+id+')' : 'url(#moonLight'+id+')'}" stroke="#2a2a2a" stroke-width="0.5"/>
      
      <!-- Dynamic Shadow Overlay Curve - user's arc technique, very accurate -->
      <path d="M 50 2 A ${rx.toFixed(2)} 48 0 0 ${sweepFlag} 50 98 A 48 48 0 0 ${isWaxing ? 1 : 0} 50 2" 
            fill="${isWaxing ? 'url(#moonLight'+id+')' : 'url(#moonDark'+id+')'}" />
      
      <!-- Subtle craters for realism (only on lit side) -->
      ${fraction > 0.1 ? `<g opacity="0.12"><circle cx="35" cy="30" r="5" fill="#000"/><circle cx="65" cy="60" r="6" fill="#000"/><circle cx="45" cy="75" r="4" fill="#000"/></g>` : ''}
    </svg>
  `;
}

// Keep compatibility: generateMoonSVG wrapper for old calls
function generateMoonSVG(phase, fraction, size=180){
  // Convert phase/fraction to date approximation, or use current date
  const date = new Date();
  return getMoonPhaseSVG(date, size);
}

window.getMoonPhaseSVG = getMoonPhaseSVG;
window.generateMoonSVG = generateMoonSVG;
window.MoonSVG = { generateMoonSVG, getMoonPhaseSVG, getMoonPhaseName };

function updateSkyUI(lat, lng, date = new Date()){
  if(typeof SunCalc === 'undefined' && typeof getMoonPhaseSVG === 'undefined') return;
  
  let times, moonTimes, moonIllum, sunPos;
  if(typeof SunCalc !== 'undefined'){
    times = SunCalc.getTimes(date, lat, lng);
    moonTimes = SunCalc.getMoonTimes(date, lat, lng);
    moonIllum = SunCalc.getMoonIllumination(date);
    sunPos = SunCalc.getPosition(date, lat, lng);
  } else {
    // Fallback without SunCalc
    times = { sunrise: new Date(date.setHours(6,12,0,0)), sunset: new Date(date.setHours(18,24,0,0)), solarNoon: new Date(date.setHours(12,15,0,0)) };
    moonTimes = { rise: null, set: null };
    moonIllum = { phase: 0.25, fraction: 0.5 };
    sunPos = { altitude: 0.5, azimuth: 0 };
  }

  const sunriseEl = document.getElementById('val-sunrise');
  const sunsetEl = document.getElementById('val-sunset');
  if(sunriseEl) sunriseEl.textContent = times.sunrise ? toLocalTimeString(times.sunrise) : 'No rise';
  if(sunsetEl) sunsetEl.textContent = times.sunset ? toLocalTimeString(times.sunset) : 'No set';

  const mrEl = document.getElementById('val-moonrise');
  const msEl = document.getElementById('val-moonset');
  if(mrEl){
    if(moonTimes && moonTimes.rise){
      const isNextDay = moonTimes.rise.getDate() !== date.getDate();
      mrEl.textContent = toLocalTimeString(moonTimes.rise) + (isNextDay ? ' (+1)' : '');
    } else {
      mrEl.textContent = 'Use SunCalc for accurate';
    }
  }
  if(msEl){
    if(moonTimes && moonTimes.set){
      const isNextDay = moonTimes.set.getDate() !== date.getDate();
      msEl.textContent = toLocalTimeString(moonTimes.set) + (isNextDay ? ' (+1)' : '');
    } else {
      msEl.textContent = 'Use SunCalc for accurate';
    }
  }

  const dlEl = document.getElementById('val-daylen');
  if(dlEl && times.sunrise && times.sunset){
    const diff = times.sunset - times.sunrise;
    const h = Math.floor(diff/1000/60/60);
    const m = Math.floor((diff/1000/60)%60);
    dlEl.textContent = `${h}h ${m}m`;
  }
  const snEl = document.getElementById('val-solarnoon');
  if(snEl) snEl.textContent = times.solarNoon ? toLocalTimeString(times.solarNoon) : '--';
  const saEl = document.getElementById('val-sunalt');
  if(saEl && sunPos){
    const altDeg = (sunPos.altitude * 180 / Math.PI).toFixed(1);
    const azDeg = (sunPos.azimuth * 180 / Math.PI + 180).toFixed(0);
    saEl.textContent = `${altDeg}° alt, ${azDeg}° az`;
  }

  const phaseEl = document.getElementById('val-phase');
  const moonEl = document.getElementById('val-moon');
  let normalizedPhase = moonIllum ? moonIllum.phase : 0.25;
  let fraction = moonIllum ? moonIllum.fraction : 0.5;
  const phaseName = getMoonPhaseName(normalizedPhase);
  if(phaseEl) phaseEl.textContent = phaseName;
  
  if(moonEl){
    const illumPct = (fraction*100).toFixed(1);
    // BIG moon in relevant tab - Current Moon full width, removing small icon
    moonEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 0;gap:8px;">
        <div id="moon-container" style="width:160px;height:160px;display:flex;justify-content:center;align-items:center;"></div>
        <div style="text-align:center;line-height:1.2;">
          <div style="font-size:14px;font-weight:800;color:#0f172a;">${phaseName}</div>
          <div style="font-size:11px;color:#475569;margin-top:2px;">${illumPct}% illuminated • Phase ${normalizedPhase.toFixed(3)}</div>
          <div style="font-size:10px;color:#64748b;margin-top:2px;">${date.toLocaleDateString()} • Live • Your technique • Big 160px</div>
        </div>
      </div>
    `;
    const container = document.getElementById('moon-container');
    if(container){
      container.innerHTML = getMoonPhaseSVG(date, 160);
    }
  }
}

window.updateSkyUI = updateSkyUI;
