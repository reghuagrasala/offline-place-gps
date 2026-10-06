/**
 * GPS Metrics module
 * Uses Geolocation + DeviceOrientation
 * Caches last known position for offline use
 */

const GPS = (() => {
  let watchId = null;
  let orientationHandler = null;
  let lastPosition = null;
  let headingActive = false;

  const STORAGE_KEY = "placeData_lastGPS";

  function loadCached() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) lastPosition = JSON.parse(raw);
    } catch (e) {}
    return lastPosition;
  }

  function saveCache(pos) {
    lastPosition = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      elev: pos.coords.altitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      timestamp: pos.timestamp
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lastPosition));
    } catch (e) {}
  }

  function startWatch(onUpdate) {
    if (!navigator.geolocation) {
      onUpdate({ error: "Geolocation not supported" });
      return;
    }

    // First try cached for instant UI
    const cached = loadCached();
    if (cached) onUpdate({ ...cached, fromCache: true });

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        saveCache(pos);
        onUpdate({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          elev: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
          fromCache: false
        });
      },
      (err) => {
        console.warn("GPS error", err);
        if (lastPosition) onUpdate({ ...lastPosition, fromCache: true, error: err.message });
        else onUpdate({ error: err.message });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5 * 60 * 1000,   // accept up to 5 min old fix (flight / tunnel)
        timeout: 20000
      }
    );
  }

  function stopWatch() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  // Device Orientation for live heading (touch-activated)
  function requestHeading(onHeading) {
    if (headingActive) return;

    const handler = (e) => {
      // webkitCompassHeading is iOS absolute, alpha is relative
      let heading = e.webkitCompassHeading;
      if (heading === undefined || heading === null) {
        // Android / relative
        heading = (360 - e.alpha) % 360;
      }
      if (heading !== null && !isNaN(heading)) {
        onHeading(heading);
      }
    };

    // iOS 13+ requires permission
    if (typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === "granted") {
            window.addEventListener("deviceorientation", handler, true);
            orientationHandler = handler;
            headingActive = true;
          } else {
            onHeading(null, "Permission denied");
          }
        })
        .catch(() => onHeading(null, "Permission error"));
    } else {
      window.addEventListener("deviceorientation", handler, true);
      orientationHandler = handler;
      headingActive = true;
    }
  }

  function stopHeading() {
    if (orientationHandler) {
      window.removeEventListener("deviceorientation", orientationHandler, true);
      orientationHandler = null;
      headingActive = false;
    }
  }

  function getDirection(deg) {
    const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  return {
    startWatch,
    stopWatch,
    requestHeading,
    stopHeading,
    getDirection,
    loadCached
  };
})();

window.GPS = GPS;
