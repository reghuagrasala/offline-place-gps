/**
 * Tap-to-detail + Copy functionality
 * Every metric / sky card becomes tappable
 */
const DETAIL = (() => {
  const sheet = () => document.getElementById("detail-sheet");
  const overlay = () => document.getElementById("sheet-overlay");
  const titleEl = () => document.getElementById("detail-title");
  const valueEl = () => document.getElementById("detail-value");
  const descEl = () => document.getElementById("detail-desc");
  const toast = () => document.getElementById("toast");

  let currentValue = "";

  const DESCRIPTIONS = {
    digipin: "India Post Digital PIN – 10-character code for a ~4 m × 4 m grid. Calculated fully offline. Shows OUTSIDE INDIA when you are abroad.",
    longitude: "East-West position on Earth. Positive values are East of the Prime Meridian.",
    latitude: "North-South position on Earth. Positive values are North of the Equator.",
    elevation: "Height above mean sea level reported by the device GPS (may be unavailable indoors).",
    heading: "Direction the device is pointing. Tap the card once to activate the live compass (works fully offline).",
    accuracy: "Estimated GPS error radius. Lower numbers are better. Improves significantly in open air.",
    date: "Current date according to the device clock and local timezone.",
    time: "Current time according to the device clock and local timezone.",
    moon: "Current moon phase, illumination percentage and mean diameter. Calculated on-device.",
    sunrise: "Time of sunrise at your current (or last known) location.",
    sunset: "Time of sunset at your current (or last known) location.",
    moonrise: "Approximate moonrise time (offline calculation or last network value).",
    moonset: "Approximate moonset time (offline calculation or last network value).",
    phase: "Name of the current lunar phase.",
    daylen: "Length of daylight for the current day at your location.",
    solarnoon: "Moment when the sun is at its highest point in the sky.",
    sunalt: "Current or maximum solar altitude / temperature fallback."
  };

  function open(title, value, key) {
    currentValue = value || "";
    titleEl().textContent = title;
    valueEl().textContent = value || "--";
    descEl().textContent = DESCRIPTIONS[key] || "Tap Copy to copy this value to the clipboard.";
    sheet().classList.add("open");
    overlay().classList.add("open");
  }

  function close() {
    sheet().classList.remove("open");
    overlay().classList.remove("open");
  }

  function showToast(msg) {
    const t = toast();
    t.textContent = msg || "Copied";
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1600);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(currentValue);
      showToast("Copied to clipboard");
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = currentValue;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Copied");
    }
  }

  function init() {
    // Close handlers
    document.getElementById("btn-close-sheet")?.addEventListener("click", close);
    document.getElementById("sheet-overlay")?.addEventListener("click", close);
    document.getElementById("btn-copy")?.addEventListener("click", copy);

    // Bind cards
    const bindings = [
      { sel: ".digipin-card", title: "DIGIPIN", key: "digipin", val: "#val-digipin" },
      { sel: ".metric-card", title: null, key: null } // handled specially
    ];

    // Individual metric cards by label
    document.querySelectorAll(".metric-card").forEach(card => {
      card.addEventListener("click", () => {
        const label = card.querySelector(".label")?.textContent?.trim().toLowerCase() || "";
        const value = card.querySelector(".value")?.textContent?.trim() || "";
        const keyMap = {
          "digipin": "digipin",
          "longitude": "longitude",
          "latitude": "latitude",
          "elevation": "elevation",
          "heading": "heading",
          "accuracy": "accuracy",
          "date": "date",
          "time": "time"
        };
        const key = keyMap[label] || label;
        open(label.charAt(0).toUpperCase() + label.slice(1), value, key);
      });
    });

    document.querySelectorAll(".sky-card").forEach(card => {
      card.addEventListener("click", () => {
        const label = card.querySelector(".label")?.textContent?.trim() || "Sky Data";
        const value = card.querySelector(".value")?.textContent?.trim() || "";
        const keyMap = {
          "Current Moon": "moon",
          "Sunrise": "sunrise",
          "Sunset": "sunset",
          "Moonrise": "moonrise",
          "Moonset": "moonset",
          "Moon Phase": "phase",
          "Day Length": "daylen",
          "Solar Noon": "solarnoon",
          "Sun Altitudes": "sunalt"
        };
        open(label, value, keyMap[label] || "moon");
      });
    });

    // Clear offline data
    document.getElementById("btn-clear-data")?.addEventListener("click", async () => {
      if (!confirm("Clear all cached GPS, sky and offline data?")) return;
      if (window.STORAGE) await STORAGE.clearAll();
      // Also clear legacy localStorage keys
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("placeData_") || k.startsWith("pd_")) localStorage.removeItem(k);
      });
      showToast("Offline data cleared");
      setTimeout(() => location.reload(), 800);
    });
  }

  return { init, open, close, showToast };
})();

window.DETAIL = DETAIL;
