/**
 * Multi-source fallback layer
 * GPS → IP geolocation → last cache
 * Sky  → Open-Meteo → Sunrise-Sunset.org → pure offline calc
 * Weather → Open-Meteo → wttr.in → cache
 * Always returns something usable
 */

const FALLBACK = (() => {

  // ---------- IP Geolocation (when device GPS fails) ----------
  async function ipLocation() {
    const endpoints = [
      "https://ipapi.co/json/",
      "https://ipinfo.io/json",
      "https://freeipapi.com/api/json"
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) continue;
        const j = await res.json();
        const lat = parseFloat(j.latitude || j.lat);
        const lon = parseFloat(j.longitude || j.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            lat, lon,
            city: j.city || j.region || "",
            country: j.country_name || j.country || "",
            source: "ip:" + new URL(url).hostname,
            accuracy: 5000 // typical IP accuracy
          };
        }
      } catch {}
    }
    return null;
  }

  // ---------- Sunrise-Sunset.org (free, no key) ----------
  async function sunriseSunsetOrg(lat, lon) {
    try {
      const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const j = await res.json();
      if (j.status !== "OK") return null;
      return {
        sunrise: new Date(j.results.sunrise),
        sunset:  new Date(j.results.sunset),
        solarNoon: new Date(j.results.solar_noon),
        dayLength: j.results.day_length, // seconds
        source: "sunrise-sunset.org"
      };
    } catch {
      return null;
    }
  }

  // ---------- wttr.in weather (no key, very reliable) ----------
  async function wttrWeather(lat, lon) {
    try {
      const url = `https://wttr.in/${lat},${lon}?format=j1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      const j = await res.json();
      const cur = j.current_condition?.[0];
      const astro = j.weather?.[0]?.astronomy?.[0];
      if (!cur) return null;
      return {
        temp: cur.temp_C + "°C",
        desc: cur.weatherDesc?.[0]?.value || "",
        humidity: cur.humidity + "%",
        wind: cur.windspeedKmph + " km/h",
        sunrise: astro?.sunrise || null,
        sunset:  astro?.sunset  || null,
        source: "wttr.in"
      };
    } catch {
      return null;
    }
  }

  // ---------- Open-Meteo (primary) ----------
  async function openMeteo(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
        `&daily=sunrise,sunset,daylight_duration` +
        `&timezone=auto`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      const j = await res.json();
      return {
        temp: j.current?.temperature_2m != null ? j.current.temperature_2m + "°C" : null,
        humidity: j.current?.relative_humidity_2m != null ? j.current.relative_humidity_2m + "%" : null,
        wind: j.current?.wind_speed_10m != null ? j.current.wind_speed_10m + " km/h" : null,
        sunrise: j.daily?.sunrise?.[0] ? new Date(j.daily.sunrise[0]) : null,
        sunset:  j.daily?.sunset?.[0]  ? new Date(j.daily.sunset[0])  : null,
        dayLength: j.daily?.daylight_duration?.[0] ?? null,
        source: "open-meteo"
      };
    } catch {
      return null;
    }
  }

  // ---------- Unified sky+weather with waterfall ----------
  async function getSkyAndWeather(lat, lon) {
    // 1. Try Open-Meteo
    let data = await openMeteo(lat, lon);

    // 2. Fallback sunrise/sunset
    if (!data || !data.sunrise) {
      const ss = await sunriseSunsetOrg(lat, lon);
      if (ss) {
        data = data || {};
        data.sunrise   = data.sunrise   || ss.sunrise;
        data.sunset    = data.sunset    || ss.sunset;
        data.solarNoon = data.solarNoon || ss.solarNoon;
        data.dayLength = data.dayLength || ss.dayLength;
        data.source = (data.source || "") + "+sunrise-sunset.org";
      }
    }

    // 3. Fallback weather via wttr.in
    if (!data || !data.temp) {
      const w = await wttrWeather(lat, lon);
      if (w) {
        data = data || {};
        data.temp     = data.temp     || w.temp;
        data.desc     = data.desc     || w.desc;
        data.humidity = data.humidity || w.humidity;
        data.wind     = data.wind     || w.wind;
        data.sunrise  = data.sunrise  || (w.sunrise ? parseWttrTime(w.sunrise) : null);
        data.sunset   = data.sunset   || (w.sunset  ? parseWttrTime(w.sunset)  : null);
        data.source = (data.source || "") + "+wttr.in";
      }
    }

    // 4. Ultimate offline calc (always available)
    if (window.SKY) {
      const offline = await SKY.fetchSky(lat, lon); // already has pure math
      data = data || {};
      data.moonPhase        = offline.moonPhase;
      data.moonIllumination = offline.moonIllumination;
      data.moonSize         = offline.moonSize;
      data.sunrise          = data.sunrise   || offline.sunrise;
      data.sunset           = data.sunset    || offline.sunset;
      data.dayLength        = data.dayLength || offline.dayLength;
      data.solarNoon        = data.solarNoon || offline.solarNoon;
      data.moonrise         = offline.moonrise;
      data.moonset          = offline.moonset;
      data.events           = offline.events;
      if (!data.source) data.source = offline.source;
    }

    data = data || {};
    data.fromCache = false;
    return data;
  }

  function parseWttrTime(str) {
    // wttr returns "06:12 AM" style – best effort
    try {
      const d = new Date();
      const [time, mer] = str.trim().split(" ");
      let [h, m] = time.split(":").map(Number);
      if (mer && mer.toUpperCase() === "PM" && h < 12) h += 12;
      if (mer && mer.toUpperCase() === "AM" && h === 12) h = 0;
      d.setHours(h, m, 0, 0);
      return d;
    } catch { return null; }
  }

  // ---------- Location waterfall ----------
  async function getLocation(gpsData) {
    // Prefer real GPS if accuracy is decent
    if (gpsData && gpsData.lat && gpsData.accuracy < 2000) {
      return { ...gpsData, source: "device-gps" };
    }

    // Try IP as backup
    const ip = await ipLocation();
    if (ip) return ip;

    // Last resort: cached GPS
    if (gpsData && gpsData.lat) {
      return { ...gpsData, source: "cached-gps" };
    }

    // Absolute fallback (rough centre of India – only if nothing else)
    return {
      lat: 22.0, lon: 79.0,
      source: "fallback-default",
      accuracy: 999999
    };
  }

  return {
    getLocation,
    getSkyAndWeather,
    ipLocation,
    openMeteo,
    sunriseSunsetOrg,
    wttrWeather
  };
})();

window.FALLBACK = FALLBACK;
