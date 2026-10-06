/**
 * Main application controller
 * Coordinates GPS, DIGIPIN, Sky, Map
 * Handles UI updates + offline status
 */

(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // UI elements
  const els = {
    digipin: $("#val-digipin"),
    lon: $("#val-lon"),
    lat: $("#val-lat"),
    elev: $("#val-elev"),
    heading: $("#val-heading"),
    accuracy: $("#val-accuracy"),
    date: $("#val-date"),
    time: $("#val-time"),
    arrow: $("#heading-arrow"),
    status: $("#status"),
    moon: $("#val-moon"),
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

  let currentHeading = 0;

  function updateStatus(online, msg) {
    if (!els.status) return;
    if (msg) {
      els.status.textContent = msg;
    } else if (online) {
      els.status.textContent = "Online – live data";
    } else {
      els.status.textContent = "Offline / Flight mode – sensors + calculations active";
    }
    els.status.className = "status-bar " + (online ? "online" : "offline");
  }

  function formatCoord(v, type) {
    if (v === null || v === undefined || isNaN(v)) return "--";
    const abs = Math.abs(v).toFixed(6);
    if (type === "lat") return abs + "° " + (v >= 0 ? "N" : "S");
    if (type === "lon") return abs + "° " + (v >= 0 ? "E" : "W");
    return abs;
  }

  function formatElev(v) {
    if (v === null || v === undefined) return "--";
    return Math.round(v) + " m";
  }

  function formatAccuracy(v) {
    if (v === null || v === undefined) return "--";
    return "± " + Math.round(v) + " m";
  }

  function updateClock() {
    const now = new Date();
    if (els.date) els.date.textContent = now.toLocaleDateString(undefined, {
      day: "2-digit", month: "short", year: "numeric"
    });
    if (els.time) els.time.textContent = now.toLocaleTimeString(undefined, {
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
  }

  function setHeading(deg) {
    currentHeading = deg;
    const dir = GPS.getDirection(deg);
    if (els.heading) els.heading.textContent = Math.round(deg) + "° (" + dir + ")";
    if (els.arrow) {
      // Arrow points in the heading direction (0 = North = up, but we keep simple horizontal base)
      els.arrow.style.transform = `rotate(${deg}deg)`;
    }
  }

  async function onGPSUpdate(data) {
    // If GPS failed or accuracy is very poor, try IP fallback
    let loc = data;
    if ((!data.lat || data.error || (data.accuracy && data.accuracy > 3000)) && window.FALLBACK) {
      try {
        const better = await FALLBACK.getLocation(data);
        if (better && better.lat) loc = better;
      } catch (e) {}
    }

    if (!loc.lat) {
      updateStatus(false, "Location unavailable");
      return;
    }

    if (els.lat) els.lat.textContent = formatCoord(loc.lat, "lat");
    if (els.lon) els.lon.textContent = formatCoord(loc.lon, "lon");
    if (els.elev) els.elev.textContent = formatElev(loc.elev);
    if (els.accuracy) els.accuracy.textContent = formatAccuracy(loc.accuracy);

    // DIGIPIN
    if (loc.lat && loc.lon && window.DIGIPIN) {
      const code = DIGIPIN.latLonToDigipin(loc.lat, loc.lon);
      if (els.digipin) {
        els.digipin.textContent = code;
        if (code === "OUTSIDE INDIA") {
          els.digipin.style.fontSize = "0.95rem";
          els.digipin.style.letterSpacing = "0.5px";
        } else {
          els.digipin.style.fontSize = "";
          els.digipin.style.letterSpacing = "2px";
        }
      }
    }

    // Update map pin
    if (window.MAP && loc.lat && loc.lon) {
      MAP.setLocation(loc.lat, loc.lon);
    }

    // Always try sky (has its own multi-source fallbacks)
    loadSky(loc.lat, loc.lon);

    const srcLabel = loc.source || (loc.fromCache ? "cache" : "gps");
    updateStatus(!(loc.fromCache) && !String(srcLabel).startsWith("ip"), "Location: " + srcLabel);
  }

  async function loadSky(lat, lon) {
    // Multi-source waterfall
    let data;
    if (window.FALLBACK) {
      data = await FALLBACK.getSkyAndWeather(lat, lon);
    } else {
      data = await SKY.fetchSky(lat, lon);
    }

    if (els.moon) els.moon.textContent = `${data.moonPhase || "--"} ${data.moonIllumination || ""} · ${data.moonSize || ""}`;
    if (els.sunrise) els.sunrise.textContent = formatTime(data.sunrise);
    if (els.sunset) els.sunset.textContent = formatTime(data.sunset);
    if (els.moonrise) els.moonrise.textContent = formatTime(data.moonrise);
    if (els.moonset) els.moonset.textContent = formatTime(data.moonset);
    if (els.phase) els.phase.textContent = data.moonPhase || "--";
    if (els.daylen) els.daylen.textContent = (window.SKY && SKY.formatDuration) ? SKY.formatDuration(data.dayLength) : (data.dayLength || "--");
    if (els.solarnoon) els.solarnoon.textContent = formatTime(data.solarNoon);
    if (els.sunalt) els.sunalt.textContent = data.sunAltitude || data.temp || "--";

    // Events
    if (els.events && data.events) {
      els.events.innerHTML = data.events.map(e => `
        <div class="event-card">
          <div class="title">${e.title}</div>
          <div class="date">${e.date}</div>
          <div>${e.desc}</div>
        </div>
      `).join("");
    }

    const src = data.source || "unknown";
    if (src.includes("offline") || data.fromCache) {
      updateStatus(false, "Offline / Flight – calculated + cached data (" + src + ")");
    } else {
      updateStatus(true, "Live data (" + src + ")");
    }
  }

  function formatTime(iso) {
    if (!iso || iso === "--") return "--";
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  }

  // Heading card touch → activate live orientation
  function setupHeadingActivation() {
    if (!els.headingCard) return;
    els.headingCard.addEventListener("click", () => {
      GPS.requestHeading((deg, err) => {
        if (err) {
          if (els.heading) els.heading.textContent = "Need permission";
          return;
        }
        if (deg !== null) setHeading(deg);
      });
    });
  }


  // ---------- Dynamic sky wallpaper (fully offline) ----------
  function updateSkyWallpaper() {
    const header = document.querySelector(".header-card");
    if (!header) return;

    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;

    // Simple time-of-day periods (works offline everywhere)
    let gradient, isNight = false;

    if (h >= 5 && h < 7) {
      // Dawn
      gradient = "linear-gradient(160deg, #2a1a4a 0%, #ff7e5f 40%, #feb47b 70%, #87ceeb 100%)";
    } else if (h >= 7 && h < 10) {
      // Morning
      gradient = "linear-gradient(160deg, #4facfe 0%, #00f2fe 50%, #a8e6cf 100%)";
    } else if (h >= 10 && h < 16) {
      // Midday
      gradient = "linear-gradient(160deg, #1e90ff 0%, #87ceeb 40%, #e0f7fa 100%)";
    } else if (h >= 16 && h < 18) {
      // Late afternoon
      gradient = "linear-gradient(160deg, #f9d423 0%, #ff4e50 50%, #2a1a4a 100%)";
    } else if (h >= 18 && h < 20) {
      // Evening / Sunset
      gradient = "linear-gradient(160deg, #0f0c29 0%, #302b63 30%, #ff512f 60%, #dd2476 100%)";
    } else if (h >= 20 && h < 22) {
      // Dusk / early night
      gradient = "linear-gradient(160deg, #0a0a1a 0%, #1a1a3a 40%, #2c3e50 100%)";
      isNight = true;
    } else {
      // Deep night
      gradient = "linear-gradient(160deg, #000000 0%, #0a0a1f 40%, #1a1a2e 100%)";
      isNight = true;
    }

    header.style.background = gradient;
    header.classList.toggle("night", isNight);
  }

  // Init
  function init() {
    updateClock();
    setInterval(updateClock, 1000);

    // Dynamic sky wallpaper
    updateSkyWallpaper();
    setInterval(updateSkyWallpaper, 60 * 1000); // refresh every minute

    // Map
    if (window.MAP) MAP.init("dayNightMap");

    // GPS
    GPS.startWatch(onGPSUpdate);

    // Heading activation
    setupHeadingActivation();

    // Initial sky from cache if available
    const cachedSky = SKY.loadCache();
    if (cachedSky) {
      loadSky(28.6, 77.2); // will use cache
    }

    // Online / offline listeners
    window.addEventListener("online", () => {
      updateStatus(true);
      // Force refresh
      const last = GPS.loadCached();
      if (last) loadSky(last.lat, last.lon);
    });
    window.addEventListener("offline", () => updateStatus(false));

    // Listen for SW messages
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (e) => {
        if (e.data?.type === "DATA_REFRESH") {
          const last = GPS.loadCached();
          if (last) loadSky(last.lat, last.lon);
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
    if (window.DETAIL) DETAIL.init();
  });
})();
