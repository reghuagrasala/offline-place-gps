/**
 * Sky / Astronomy module – strong offline support
 * - Moon phase, illumination, approximate rise/set, solar times
 *   calculated purely on-device (works fully offline)
 * - Open-Meteo used only when online for higher precision
 * - Last good values cached for seamless offline use
 */

const SKY = (() => {
  const CACHE_KEY = "placeData_sky_v2";
  const CACHE_TTL = 45 * 60 * 1000; // 45 min

  // ---------- Pure offline astronomy helpers ----------
  function toJulian(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  // Approximate solar declination & equation of time
  function sunPosition(date = new Date()) {
    const rad = Math.PI / 180;
    const day = (toJulian(date) - 2451545.0);
    const g = (357.529 + 0.98560028 * day) % 360;
    const q = (280.459 + 0.98564736 * day) % 360;
    const L = (q + 1.915 * Math.sin(g * rad) + 0.020 * Math.sin(2 * g * rad)) % 360;
    const e = 23.439 - 0.00000036 * day;
    const ra = Math.atan2(Math.cos(e * rad) * Math.sin(L * rad), Math.cos(L * rad)) / rad;
    const decl = Math.asin(Math.sin(e * rad) * Math.sin(L * rad)) / rad;
    return { decl, ra, L };
  }

  // Approximate sunrise / sunset for a given lat/lon (offline)
  function approxSunTimes(lat, lon, date = new Date()) {
    const rad = Math.PI / 180;
    const { decl } = sunPosition(date);
    const latR = lat * rad;
    const declR = decl * rad;

    // Hour angle
    const cosHA = (Math.sin(-0.833 * rad) - Math.sin(latR) * Math.sin(declR)) /
                  (Math.cos(latR) * Math.cos(declR));
    if (cosHA < -1 || cosHA > 1) {
      // Polar day/night
      return { sunrise: null, sunset: null, dayLength: cosHA < -1 ? 86400 : 0 };
    }
    const HA = Math.acos(cosHA) / rad; // degrees

    // Solar noon (approx local)
    const utcNoon = 12 - lon / 15;
    const sunriseUTC = utcNoon - HA / 15;
    const sunsetUTC  = utcNoon + HA / 15;

    const base = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const sunrise = new Date(base.getTime() + sunriseUTC * 3600000);
    const sunset  = new Date(base.getTime() + sunsetUTC  * 3600000);
    const dayLength = (sunset - sunrise) / 1000;

    return { sunrise, sunset, dayLength, solarNoon: new Date(base.getTime() + utcNoon * 3600000) };
  }

  // Moon phase (synodic month approximation) – fully offline
  function moonPhase(date = new Date()) {
    // Known new moon near current epoch (Oct 2026)
    const knownNew = new Date(Date.UTC(2026, 9, 10, 15, 50));
    const synodic = 29.530588853; // days
    const days = (date - knownNew) / 86400000;
    const phase = ((days % synodic) + synodic) % synodic / synodic;
    const illum = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);

    let name;
    if (phase < 0.03 || phase > 0.97) name = "New Moon";
    else if (phase < 0.22) name = "Waxing Crescent";
    else if (phase < 0.28) name = "First Quarter";
    else if (phase < 0.47) name = "Waxing Gibbous";
    else if (phase < 0.53) name = "Full Moon";
    else if (phase < 0.72) name = "Waning Gibbous";
    else if (phase < 0.78) name = "Last Quarter";
    else name = "Waning Crescent";

    return {
      phaseName: name,
      illumination: illum + "%",
      age: (phase * synodic).toFixed(1) + " d",
      size: "3 474 km"           // mean diameter – constant
    };
  }

  // Rough moonrise / moonset offset from sunrise/sunset (offline approximation)
  function approxMoonTimes(sunrise, sunset, phase) {
    // Very rough: moonrise drifts ~50 min later each day
    if (!sunrise || !sunset) return { moonrise: null, moonset: null };
    const drift = (parseFloat(phase.age) || 0) * 50 * 60000; // ms
    return {
      moonrise: new Date(sunrise.getTime() + drift),
      moonset:  new Date(sunset.getTime()  + drift)
    };
  }

  // Current-period sky events (static list – offline)
  function getCurrentPeriodEvents() {
    return [
      { title: "Draconids Meteor Shower", date: "12 Oct 2026", desc: "Peak activity" },
      { title: "Partial Lunar Eclipse",   date: "17 Oct 2026", desc: "Visible in parts of Asia" },
      { title: "Orionids Meteor Shower",  date: "21-22 Oct 2026", desc: "Peak after midnight" },
      { title: "New Moon",                date: "10 Oct 2026", desc: "Best for deep-sky" }
    ];
  }

  // ---------- Cache helpers ----------
  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function saveCache(data) {
    data.savedAt = Date.now();
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
  }

  // ---------- Public API ----------
  async function fetchSky(lat, lon) {
    const now = new Date();
    const moon = moonPhase(now);
    const sun  = approxSunTimes(lat, lon, now);
    const moonT = approxMoonTimes(sun.sunrise, sun.sunset, moon);

    // Base offline data (always available)
    let data = {
      moonPhase: moon.phaseName,
      moonIllumination: moon.illumination,
      moonSize: moon.size,
      moonAge: moon.age,
      sunrise: sun.sunrise,
      sunset: sun.sunset,
      dayLength: sun.dayLength,
      solarNoon: sun.solarNoon,
      moonrise: moonT.moonrise,
      moonset: moonT.moonset,
      sunAltitude: null,
      events: getCurrentPeriodEvents(),
      fromCache: false,
      source: "offline-calc"
    };

    // Try network for higher precision when available
    if (navigator.onLine) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&daily=sunrise,sunset,daylight_duration` +
          `&timezone=auto`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const json = await res.json();
          if (json.daily) {
            data.sunrise   = json.daily.sunrise?.[0]   ? new Date(json.daily.sunrise[0])   : data.sunrise;
            data.sunset    = json.daily.sunset?.[0]    ? new Date(json.daily.sunset[0])    : data.sunset;
            data.dayLength = json.daily.daylight_duration?.[0] ?? data.dayLength;
            data.solarNoon = estimateSolarNoon(data.sunrise, data.sunset);
            data.source = "open-meteo";
          }
        }
      } catch (e) {
        // Network failed – keep pure offline values
        data.source = "offline-calc (network failed)";
      }
    } else {
      data.source = "offline-calc";
    }

    // Always merge with any previous cache for fields we couldn't compute
    const cached = loadCache();
    if (cached) {
      if (!data.sunAltitude && cached.sunAltitude) data.sunAltitude = cached.sunAltitude;
    }

    saveCache(data);
    return data;
  }

  function estimateSolarNoon(sunrise, sunset) {
    if (!sunrise || !sunset) return null;
    return new Date((new Date(sunrise).getTime() + new Date(sunset).getTime()) / 2);
  }

  function formatDuration(seconds) {
    if (seconds == null || isNaN(seconds)) return "--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  function formatTime(d) {
    if (!d) return "--";
    try {
      return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return "--"; }
  }

  return {
    fetchSky,
    loadCache,
    formatDuration,
    formatTime,
    moonPhase,
    approxSunTimes
  };
})();

window.SKY = SKY;
