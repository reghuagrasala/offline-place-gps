// GPS handling - dynamic, accurate
let lastLat = 10.5276, lastLng = 76.2144;
let lastAcc = null, lastAlt = null, lastSpeed = null, lastHeading = null;

function updateGPUI(pos){
  const c = pos.coords;
  lastLat = c.latitude; lastLng = c.longitude;
  lastAcc = c.accuracy; lastAlt = c.altitude; lastSpeed = c.speed; lastHeading = c.heading;

  document.getElementById('val-lat').textContent = c.latitude.toFixed(6);
  document.getElementById('val-lon').textContent = c.longitude.toFixed(6);
  document.getElementById('val-accuracy').textContent = c.accuracy ? c.accuracy.toFixed(1)+' m' : '--';
  document.getElementById('val-elev').textContent = c.altitude ? c.altitude.toFixed(1)+' m' : (c.altitude===0?'0 m':'--');
  document.getElementById('val-heading').textContent = (c.heading!==null && !isNaN(c.heading)) ? c.heading.toFixed(1)+'°' : '--°';
  
  const speedKmh = c.speed ? (c.speed*3.6).toFixed(1)+' km/h' : '0 km/h';
  // Speed element not in new layout? Use elevation card for speed? Actually we have separate.
  // In new index.html we have no speed card? We have heading card only. Let's add speed if exists.
  const speedEl = document.getElementById('val-speed');
  if(speedEl) speedEl.textContent = speedKmh;

  // Heading arrow
  const arrow = document.getElementById('heading-arrow');
  if(arrow && c.heading!==null){
    arrow.style.transform = `rotate(${c.heading}deg)`;
    arrow.style.opacity = '1';
  }

  // Date / Time
  const now = new Date();
  document.getElementById('val-date').textContent = now.toLocaleDateString();
  document.getElementById('val-time').textContent = now.toLocaleTimeString();

  // DIGIPIN - dynamic, correct algorithm
  if(window.getDigiPin){
    try{
      const pin = getDigiPin(c.latitude, c.longitude);
      const spaced = pin.replace(/-/g,'').split('').join(' ');
      document.getElementById('val-digipin').textContent = spaced + ' • ' + pin;
      document.getElementById('val-digipin').title = pin + ' - ' + c.latitude.toFixed(6)+','+c.longitude.toFixed(6);
    }catch(e){
      document.getElementById('val-digipin').textContent = e.message || 'OUTSIDE INDIA';
    }
  }

  // Sky update
  if(window.updateSkyUI){
    updateSkyUI(c.latitude, c.longitude, new Date());
  }

  // Map update - globe marker
  if(window.updateGlobeMarker){
    updateGlobeMarker(c.latitude, c.longitude);
  }

  // Status
  const status = document.getElementById('status');
  if(status){
    status.textContent = `Live • ${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)} • ±${c.accuracy?.toFixed(0)}m`;
    status.className = 'status-bar online';
  }

  // Save for offline
  if(window.AppStorage){
    AppStorage.set('lastGPS', { lat: c.latitude, lng: c.longitude, acc: c.accuracy, alt: c.altitude, heading: c.heading, time: new Date().toISOString() });
  }
}

function handleGPSError(err){
  console.warn('GPS error', err);
  const status = document.getElementById('status');
  if(status){
    status.textContent = 'GPS: '+err.message+' • Using last known';
    status.className = 'status-bar offline';
  }
  // Use last known or default
  const last = window.AppStorage ? AppStorage.get('lastGPS') : null;
  if(last){
    lastLat = last.lat; lastLng = last.lng;
    document.getElementById('val-lat').textContent = last.lat.toFixed(6);
    document.getElementById('val-lon').textContent = last.lng.toFixed(6);
    if(window.getDigiPin){
      const pin = getDigiPin(last.lat, last.lng);
      document.getElementById('val-digipin').textContent = pin.replace(/-/g,'').split('').join(' ') + ' • ' + pin;
    }
    if(window.updateSkyUI) updateSkyUI(last.lat, last.lng);
    if(window.updateGlobeMarker) updateGlobeMarker(last.lat, last.lng);
  } else {
    // Default Thrissur
    document.getElementById('val-lat').textContent = '10.527600';
    document.getElementById('val-lon').textContent = '76.214400';
    if(window.getDigiPin){
      const pin = getDigiPin(10.5276,76.2144);
      document.getElementById('val-digipin').textContent = pin.replace(/-/g,'').split('').join(' ') + ' • ' + pin;
    }
    if(window.updateSkyUI) updateSkyUI(10.5276,76.2144);
    if(window.updateGlobeMarker) updateGlobeMarker(10.5276,76.2144);
  }
}

function initGPS(){
  if(!navigator.geolocation){
    handleGPSError({message:'Geolocation not supported'});
    return;
  }
  navigator.geolocation.watchPosition(updateGPUI, handleGPSError, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 15000
  });
  // Heading via DeviceOrientation for realistic compass
  if(window.DeviceOrientationEvent){
    // iOS needs permission
    const headingCard = document.getElementById('heading-card');
    if(headingCard){
      headingCard.addEventListener('click', async ()=>{
        try{
          if(typeof DeviceOrientationEvent.requestPermission === 'function'){
            const perm = await DeviceOrientationEvent.requestPermission();
            if(perm !== 'granted') throw new Error('Permission denied');
          }
          window.addEventListener('deviceorientation', (e)=>{
            let heading = e.webkitCompassHeading || (360 - e.alpha);
            if(heading!==null && !isNaN(heading)){
              document.getElementById('val-heading').textContent = heading.toFixed(1)+'°';
              const arrow = document.getElementById('heading-arrow');
              if(arrow){
                arrow.style.transform = `rotate(${heading}deg)`;
                arrow.style.opacity = '1';
              }
              lastHeading = heading;
            }
          }, true);
          window.showToast && showToast('Compass activated • Move phone');
        }catch(err){
          window.showToast && showToast('Compass permission: '+err.message);
        }
      });
    }
  }
}

window.initGPS = initGPS;
window.lastLat = lastLat;
window.lastLng = lastLng;
