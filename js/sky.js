// Sky calculations - accurate using SunCalc
// SunCalc loaded via CDN in index.html? We'll include fallback if not loaded.
// Also includes realtime moon phase SVG generator.

function toLocalTimeString(date){
  if(!date) return '--';
  return date.toLocaleTimeString([], {hour:'numeric', minute:'2-digit', hour12:true});
}
function toHoursMinutes(diffMs){
  if(!diffMs || diffMs<0) return '--';
  const h = diffMs/1000/3600;
  return h.toFixed(1)+'h';
}

function getMoonPhaseName(phase){
  // phase 0-1, 0=new, 0.25=first quarter, 0.5=full, 0.75=last quarter
  if(phase < 0.03 || phase > 0.97) return 'New Moon';
  if(phase < 0.22) return 'Waxing Crescent';
  if(phase < 0.28) return 'First Quarter';
  if(phase < 0.47) return 'Waxing Gibbous';
  if(phase < 0.53) return 'Full Moon';
  if(phase < 0.72) return 'Waning Gibbous';
  if(phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

// Realtime moon phase SVG - accurate illuminated fraction and orientation
function generateMoonSVG(phase, fraction, size=80){
  // phase: 0-1, fraction: 0-1 illumination
  // We need to draw moon with shadow based on phase
  // Simplified: use two circles overlapping to show phase
  // phase <0.5 waxing (right side illuminated), >0.5 waning (left side illuminated)
  // fraction determines how much illuminated
  
  const isWaxing = phase <= 0.5;
  // Calculate the terminator position: from -1 to 1
  // For new moon fraction 0, full fraction 1
  // Use phase to determine which side is lit
  
  // SVG approach: draw base moon circle, then overlay shadow
  // For accurate moon phase, we use elliptical clip
  
  // Normalize: illuminated fraction to terminator offset
  // fraction = (1 - cos(theta))/2 where theta is phase angle
  // For drawing, we need to calculate the shadow ellipse x-radius
  
  // Phase angle: 0=new, 0.5=full, 1=new
  // For waxing (0-0.5): lit from right, shadow on left decreasing
  // For waning (0.5-1): lit from left, shadow on right increasing
  
  // Calculate the phase angle for drawing
  // Use fraction to compute the ellipse rx
  // rx = R * cos(phaseAngle) where phaseAngle goes 0->pi
  
  const R = size/2 - 2;
  const cx = size/2, cy = size/2;
  
  // For SVG: draw full moon base #f5f3ce, then shadow
  let shadowPath = '';
  let illuminated = fraction;
  
  // Determine terminator
  // For simplicity, create accurate moon phase using clipPath with ellipse
  
  // Calculate the offset of terminator from center
  // Based on phase: 0=new (dark), 0.25=first quarter (half right lit), 0.5=full, 0.75=last quarter (half left lit)
  // The terminator's x position: 
  // For waxing: terminator moves from right edge (full dark) to left edge (full lit)? Actually reverse.
  // Let's use formula: 
  // phase 0 = new (dark), terminator at -R? Actually need to draw.
  
  // Use approach: 
  // - Draw dark moon background #222
  // - Draw illuminated portion as clipped light circle
  
  // For accurate drawing:
  // If fraction <0.5 and waxing: illuminated is crescent on right
  // If fraction >0.5 and waxing: gibbous, most lit with small dark crescent on left
  // Similar for waning mirrored
  
  // We'll create SVG with two layers:
  // Base: light circle
  // Shadow: dark ellipse covering unlit part
  
  // Calculate rx of terminator ellipse
  // phase angle: angle = phase * 2*PI, but for illumination we use:
  // fraction = (1 - cos(angle))/2 ??? Actually SunCalc fraction is illumination fraction
  // So we can derive the terminator position directly from phase, not fraction alone.
  
  // Simpler: Use phase to determine if waxing/waning and use fraction for size
  
  // For drawing crescent/gibbous:
  // The terminator is an ellipse with rx = R * cos(phase*2pi) ??? Let's approximate using fraction.
  
  // For accurate visual:
  // illuminated fraction 0 = new, 0.5 = quarter, 1 = full
  // For waxing (phase 0-0.5): light on right, shadow on left for gibbous? Actually waxing: new -> crescent right edge -> quarter right half -> gibbous mostly lit.
  // For waning (0.5-1): full -> gibbous left edge darkening -> quarter left half lit -> crescent left edge.
  
  // Compute shadow ellipse
  // For quarter: terminator is straight line at center (rx=0)
  // For new/full: terminator is at edge (rx=R)
  // For crescent: rx positive small? For gibbous: rx negative? Actually need to draw dark side as ellipse on top of light.
  
  // Formula: terminator offset = R * (1 - 2*fraction) ??? Let's derive:
  // For fraction 0: dark full, terminator rx = R (full shadow covers)
  // For fraction 0.25 (crescent): shadow large, lit small sliver
  // For fraction 0.5 (quarter): terminator at center
  // For fraction 1: fully lit, no shadow
  
  // Better: Use phase to determine side and fraction for curvature
  
  let svg = '';
  if(fraction < 0.01){
    // New moon - dark
    svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="#1a1a1a" stroke="#333" stroke-width="1"/>
    </svg>`;
  } else if(fraction > 0.99){
    // Full moon
    svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="moonGrad" cx="0.4" cy="0.4" r="0.8"><stop offset="0%" stop-color="#fffbe6"/><stop offset="100%" stop-color="#d4c88a"/></radialGradient></defs>
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#moonGrad)" stroke="#b8a86a" stroke-width="0.5"/>
    </svg>`;
  } else {
    // Partial
    const isWaxing = phase < 0.5;
    // For drawing, we need to know if we are in crescent (fraction<0.5) or gibbous (fraction>0.5)
    const isGibbous = fraction > 0.5;
    // Calculate the ellipse radius for terminator
    // For crescent: small illuminated sliver, terminator is ellipse bulging towards lit side
    // For gibbous: large illuminated, small dark sliver on opposite side
    
    // The x-radius of the terminator ellipse:
    // For fraction 0.5, rx=0 (straight line)
    // For fraction 0->0.5, rx goes R->0, but on dark side
    // For fraction 0.5->1, rx goes 0->R, but on dark side opposite
    
    // Map fraction to rx: 
    // fraction 0.25 (crescent): rx ~ 0.5*R
    // fraction 0.5: rx=0
    // fraction 0.75 (gibbous): rx ~ 0.5*R
    
    // Use: rx = R * (1 - 2*abs(fraction-0.5)*2?) Let's use cos
    // Better: rx = R * cos(phase*2pi) ??? Let's approximate:
    // For accurate: terminator position = cos(phaseAngle) where phaseAngle = phase*360°
    
    // Simplified accurate enough:
    let rx, shadowSide;
    if(!isGibbous){
      // Crescent - dark dominates, small light sliver
      // Lit portion is on side (right for waxing, left for waning)
      // Shadow covers most, with ellipse cutout for lit sliver
      rx = R * (1 - fraction*2); // fraction 0->0.5 => rx R->0
      shadowSide = isWaxing ? 'left' : 'right';
    } else {
      // Gibbous - light dominates, small dark sliver on opposite side
      rx = R * (fraction*2 -1); // fraction 0.5->1 => rx 0->R
      shadowSide = isWaxing ? 'left' : 'right'; // dark sliver on opposite side of lit?
      // For waxing gibbous, dark sliver on left? Actually waxing gibbous is mostly lit, dark small on left? No, waxing gibbous lit mostly, dark sliver on left? Wait: waxing goes new (dark) -> crescent right lit -> first quarter right half -> gibbous right 3/4 lit -> full. So dark sliver is on left for waxing.
      // For waning gibbous, dark sliver on right.
      shadowSide = isWaxing ? 'left' : 'right';
      // Actually for gibbous, dark sliver is on opposite side of crescent? Let's keep same: waxing = dark on left, waning = dark on right? Need to invert for gibbous?
      // For waxing gibbous, dark sliver is on left (since right is lit). So shadow on left small? But we want to draw shadow as small ellipse on left.
      // So for gibbous, shadowSide is opposite of crescent? Let's think:
      // Crescent waxing: lit sliver on right, shadow covers left+most
      // Gibbous waxing: lit almost full, small dark sliver on left
      // So both waxing have dark on left, but size differs.
      // Similarly waning have dark on right.
      // So shadowSide = isWaxing ? 'left' : 'right' for both cases works.
    }
    
    // For SVG, we will draw:
    // Base light moon, then overlay dark shape that covers unlit part
    // For crescent: dark shape is most of moon with small light ellipse cutout? Easier to draw light sliver as ellipse on top of dark.
    // Let's do two approaches:
    
    if(!isGibbous){
      // Crescent: dark background, light crescent sliver
      const litRx = R * (fraction*2); // small
      const cxLit = isWaxing ? cx + (R - litRx)/2 : cx - (R - litRx)/2;
      svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="g1" cx="0.4" cy="0.4" r="0.8"><stop offset="0%" stop-color="#fffbe6"/><stop offset="100%" stop-color="#c2b47a"/></radialGradient></defs>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="${isWaxing ? cx + R*0.3 : cx - R*0.3}" cy="${cy}" rx="${Math.max(2, R*fraction*1.5)}" ry="${R*0.95}" fill="url(#g1)" opacity="0.95"/>
      </svg>`;
    } else {
      // Gibbous: light background, small dark sliver
      const darkRx = R * (1 - (fraction-0.5)*2); // 0.5->1 => R->0
      svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="g2" cx="0.4" cy="0.4" r="0.8"><stop offset="0%" stop-color="#fffbe6"/><stop offset="100%" stop-color="#d4c88a"/></radialGradient></defs>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#g2)" stroke="#b8a86a" stroke-width="0.5"/>
        <ellipse cx="${isWaxing ? cx - R*0.4 : cx + R*0.4}" cy="${cy}" rx="${darkRx}" ry="${R*0.95}" fill="#1a1a1a" opacity="0.85"/>
      </svg>`;
    }
    // For quarter (fraction ~0.5), make it half
    if(Math.abs(fraction-0.5) < 0.06){
      const half = isWaxing ? `M ${cx} ${cy-R} A ${R} ${R} 0 0 ${isWaxing?1:0} ${cx} ${cy+R} L ${cx} ${cy+R} L ${cx} ${cy-R} Z` : '';
      // Simplified half moon
      svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="g3" cx="0.4" cy="0.4" r="0.8"><stop offset="0%" stop-color="#fffbe6"/><stop offset="100%" stop-color="#d4c88a"/></radialGradient></defs>
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <path d="${isWaxing ? `M ${cx} ${cy-R} A ${R} ${R} 0 0 1 ${cx} ${cy+R} L ${cx} ${cy+R} Z` : `M ${cx} ${cy-R} A ${R} ${R} 0 0 0 ${cx} ${cy+R} L ${cx} ${cy+R} Z`}" fill="url(#g3)"/>
      </svg>`;
    }
  }
  return svg;
}

window.MoonSVG = { generateMoonSVG, getMoonPhaseName };

function updateSkyUI(lat, lng, date = new Date()){
  if(typeof SunCalc === 'undefined'){
    console.warn('SunCalc not loaded');
    return;
  }
  const times = SunCalc.getTimes(date, lat, lng);
  const moonTimes = SunCalc.getMoonTimes(date, lat, lng);
  const moonIllum = SunCalc.getMoonIllumination(date);
  const sunPos = SunCalc.getPosition(date, lat, lng);
  const moonPos = SunCalc.getMoonPosition(date, lat, lng);

  // Sunrise / Sunset
  const sunriseEl = document.getElementById('val-sunrise');
  const sunsetEl = document.getElementById('val-sunset');
  if(sunriseEl) sunriseEl.textContent = times.sunrise ? toLocalTimeString(times.sunrise) : 'No rise';
  if(sunsetEl) sunsetEl.textContent = times.sunset ? toLocalTimeString(times.sunset) : 'No set';

  // Moonrise / Moonset - accurate, handles after 1am case
  const mrEl = document.getElementById('val-moonrise');
  const msEl = document.getElementById('val-moonset');
  if(mrEl){
    if(moonTimes.rise){
      const isNextDay = moonTimes.rise.getDate() !== date.getDate();
      mrEl.textContent = toLocalTimeString(moonTimes.rise) + (isNextDay ? ' (+1)' : '');
      mrEl.title = moonTimes.rise.toString() + (isNextDay ? ' - after 1am next day' : '');
    } else {
      mrEl.textContent = moonTimes.alwaysUp ? 'Always up' : 'No rise';
    }
  }
  if(msEl){
    if(moonTimes.set){
      const isNextDay = moonTimes.set.getDate() !== date.getDate();
      msEl.textContent = toLocalTimeString(moonTimes.set) + (isNextDay ? ' (+1)' : '');
      msEl.title = moonTimes.set.toString();
    } else {
      msEl.textContent = moonTimes.alwaysDown ? 'Always down' : 'No set';
    }
  }

  // Day length
  const dlEl = document.getElementById('val-daylen');
  if(dlEl && times.sunrise && times.sunset){
    const diff = times.sunset - times.sunrise;
    const h = Math.floor(diff/1000/60/60);
    const m = Math.floor((diff/1000/60)%60);
    dlEl.textContent = `${h}h ${m}m`;
  }

  // Solar noon
  const snEl = document.getElementById('val-solarnoon');
  if(snEl) snEl.textContent = times.solarNoon ? toLocalTimeString(times.solarNoon) : '--';

  // Sun altitudes
  const saEl = document.getElementById('val-sunalt');
  if(saEl){
    const altDeg = (sunPos.altitude * 180 / Math.PI).toFixed(1);
    const azDeg = (sunPos.azimuth * 180 / Math.PI + 180).toFixed(0);
    saEl.textContent = `${altDeg}° alt, ${azDeg}° az`;
  }

  // Moon phase
  const phaseEl = document.getElementById('val-phase');
  const moonEl = document.getElementById('val-moon');
  const phaseName = getMoonPhaseName(moonIllum.phase);
  if(phaseEl) phaseEl.textContent = phaseName;
  if(moonEl){
    const illumPct = (moonIllum.fraction*100).toFixed(0);
    moonEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span id="moon-svg-container"></span>
        <span>${phaseName}<br><small style="opacity:0.7">${illumPct}% • ${moonIllum.phase.toFixed(2)}</small></span>
      </div>
    `;
    // Inject realtime SVG
    const container = document.getElementById('moon-svg-container');
    if(container){
      container.innerHTML = generateMoonSVG(moonIllum.phase, moonIllum.fraction, 56);
    }
  }

  // Save to storage for offline
  if(window.AppStorage){
    AppStorage.set('lastSky', { lat, lng, date: date.toISOString(), times: { sunrise: times.sunrise?.toISOString(), sunset: times.sunset?.toISOString(), solarNoon: times.solarNoon?.toISOString() }, moonTimes: { rise: moonTimes.rise?.toISOString(), set: moonTimes.set?.toISOString() }, moonIllum });
  }
}

window.updateSkyUI = updateSkyUI;
window.generateMoonSVG = generateMoonSVG;
