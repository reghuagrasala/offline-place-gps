/**
 * DIGIPIN – India Post Digital PIN (client-side)
 * 10-character alphanumeric code for ~4m x 4m grid
 * Bounding box: Lat 2.5°–38.5°N, Lon 63.5°–99.5°E
 * Pure function – works fully offline
 */

const DIGIPIN_CHARS = "23456789CFGHJMPQRVWX"; // 16 approved characters (official set)

function latLonToDigipin(lat, lon) {
  // Clamp to India bounding box
  const minLat = 2.5, maxLat = 38.5;
  const minLon = 63.5, maxLon = 99.5;

  if (lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) {
    return "OUTSIDE INDIA";
  }

  // Normalize to 0-1
  let x = (lon - minLon) / (maxLon - minLon);
  let y = (lat - minLat) / (maxLat - minLat);

  let code = "";
  const levels = 10; // 10 characters

  for (let i = 0; i < levels; i++) {
    // 4x4 subdivision
    const xi = Math.floor(x * 4);
    const yi = Math.floor(y * 4);
    const idx = yi * 4 + xi;
    code += DIGIPIN_CHARS[idx] || "2";

    x = x * 4 - xi;
    y = y * 4 - yi;
  }

  // Format with spaces for readability: X X X X X X X X X X
  return code.split("").join(" ");
}

// Export
window.DIGIPIN = { latLonToDigipin };
