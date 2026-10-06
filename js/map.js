/**
 * Attractive offline Globe (orthographic projection)
 * - Default: full globe centered on GPS
 * - Pinch-zoom + drag-rotate supported
 * - Auto-returns to default view after interaction ends
 * - Day/Night terminator calculated on-device (no network)
 * - Fully offline after first load
 */
const MAP = (() => {
  let canvas, ctx;
  let userLat = 28.6, userLon = 77.2;
  let width = 0, height = 0, dpr = 1;

  // View state
  let rotLon = 0;          // current rotation (degrees)
  let rotLat = 0;
  let targetRotLon = 0;
  let targetRotLat = 0;
  let scale = 1;           // zoom scale
  let targetScale = 1;
  let isInteracting = false;
  let resetTimer = null;
  const RESET_DELAY = 4500; // ms after last interaction → return to default

  // Touch / pointer state
  let pointers = new Map();
  let lastPinchDist = 0;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);

    // Pointer events (mouse + touch)
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    // Start animation loop
    requestAnimationFrame(loop);
  }

  function resize() {
    if (!canvas) return;
    const parent = canvas.parentElement;
    width = parent.clientWidth;
    height = parent.clientHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setLocation(lat, lon) {
    userLat = lat;
    userLon = lon;
    // Smoothly center on new location if not interacting
    if (!isInteracting) {
      targetRotLon = -lon;
      targetRotLat = -lat * 0.6; // slight tilt looks nicer
    }
  }

  // ---------- Interaction ----------
  function onPointerDown(e) {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    isInteracting = true;
    clearTimeout(resetTimer);
    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
      // Drag rotate
      rotLon += dx * 0.4;
      rotLat = Math.max(-80, Math.min(80, rotLat - dy * 0.3));
      targetRotLon = rotLon;
      targetRotLat = rotLat;
    } else if (pointers.size === 2) {
      // Pinch zoom
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinchDist > 0) {
        const factor = dist / lastPinchDist;
        scale = Math.max(0.7, Math.min(3.5, scale * factor));
        targetScale = scale;
      }
      lastPinchDist = dist;
    }
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastPinchDist = 0;
    if (pointers.size === 0) {
      isInteracting = false;
      // Schedule return to default (GPS-centered full globe)
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        targetRotLon = -userLon;
        targetRotLat = -userLat * 0.6;
        targetScale = 1;
      }, RESET_DELAY);
    }
  }

  // ---------- Drawing ----------
  function project(lon, lat, R) {
    // Orthographic projection with rotation
    const lonR = (lon + rotLon) * Math.PI / 180;
    const latR = (lat + rotLat) * Math.PI / 180;
    const x = R * Math.cos(latR) * Math.sin(lonR);
    const y = -R * Math.sin(latR);
    const z = R * Math.cos(latR) * Math.cos(lonR); // depth
    return { x, y, z, visible: z > -R * 0.05 };
  }

  function getSunLon() {
    // Approximate subsolar longitude from UTC
    const now = new Date();
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    return 180 - utcHours * 15; // rough
  }

  function isNight(lon, lat, sunLon) {
    const rad = Math.PI / 180;
    // Simple solar elevation approximation
    const ha = (lon - sunLon) * rad;
    const cosz = Math.cos(lat * rad) * Math.cos(ha);
    return cosz < 0.05;
  }

  function drawGlobe() {
    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(width, height) * 0.42 * scale;

    // Background
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, width, height);

    // Soft glow behind globe
    const grd = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.3);
    grd.addColorStop(0, "rgba(30,60,120,0.25)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    // Globe disk
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = "#0a1a30";
    ctx.fill();

    // Atmosphere rim
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(100,180,255,0.35)";
    ctx.lineWidth = 3;
    ctx.stroke();

    const sunLon = getSunLon();

    // Simple land masses (more recognizable shapes)
    const lands = [
      // Africa
      { lon: 20, lat: 5, rx: 18, ry: 28 },
      // Europe
      { lon: 15, lat: 50, rx: 12, ry: 10 },
      // Asia
      { lon: 90, lat: 40, rx: 40, ry: 25 },
      // Australia
      { lon: 135, lat: -25, rx: 14, ry: 12 },
      // N America
      { lon: -100, lat: 45, rx: 28, ry: 22 },
      // S America
      { lon: -60, lat: -15, rx: 14, ry: 28 },
      // Antarctica (bottom)
      { lon: 0, lat: -80, rx: 50, ry: 8 }
    ];

    // Draw nightside first (darker)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    // Fill ocean base
    ctx.fillStyle = "#0c2340";
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    // Day side gradient
    const sunX = cx + R * 0.35 * Math.sin((sunLon + rotLon) * Math.PI / 180);
    const dayGrad = ctx.createRadialGradient(sunX, cy - R * 0.2, 0, cx, cy, R * 1.4);
    dayGrad.addColorStop(0, "#1a4a7a");
    dayGrad.addColorStop(0.5, "#0c2a4a");
    dayGrad.addColorStop(1, "#050f1a");
    ctx.fillStyle = dayGrad;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    // Land
    lands.forEach(land => {
      const p = project(land.lon, land.lat, R);
      if (!p.visible) return;
      const night = isNight(land.lon, land.lat, sunLon);
      ctx.beginPath();
      ctx.ellipse(cx + p.x, cy + p.y, land.rx * scale * 0.9, land.ry * scale * 0.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = night ? "#0d2a1a" : "#1a5c35";
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Night shade overlay (soft)
    ctx.fillStyle = "rgba(0,0,15,0.45)";
    // Approximate night half
    const nightAngle = (sunLon + rotLon + 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, nightAngle, nightAngle + Math.PI);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // User location pin + dynamic coordinate label
    const pin = project(userLon, userLat, R);
    if (pin.visible) {
      const px = cx + pin.x;
      const py = cy + pin.y;

      // Glow
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,60,50,0.35)";
      ctx.fill();

      // Pin
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ff3b30";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Small dynamic coordinate label
      const latStr = Math.abs(userLat).toFixed(2) + "°" + (userLat >= 0 ? "N" : "S");
      const lonStr = Math.abs(userLon).toFixed(2) + "°" + (userLon >= 0 ? "E" : "W");
      const label = latStr + "  " + lonStr;

      ctx.font = "600 11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Background pill for readability
      const metrics = ctx.measureText(label);
      const padX = 6, padY = 3;
      const lw = metrics.width + padX * 2;
      const lh = 16;
      const lx = px - lw / 2;
      const ly = py + 10;

      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.beginPath();
      // rounded rect
      const r = 4;
      ctx.moveTo(lx + r, ly);
      ctx.arcTo(lx + lw, ly, lx + lw, ly + lh, r);
      ctx.arcTo(lx + lw, ly + lh, lx, ly + lh, r);
      ctx.arcTo(lx, ly + lh, lx, ly, r);
      ctx.arcTo(lx, ly, lx + lw, ly, r);
      ctx.closePath();
      ctx.fill();

      // Text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, px, ly + padY);
    }

    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      for (let lon = -180; lon <= 180; lon += 5) {
        const p = project(lon, lat, R);
        if (p.visible) {
          const x = cx + p.x, y = cy + p.y;
          if (lon === -180) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }

  function loop() {
    // Smooth interpolation toward targets
    rotLon += (targetRotLon - rotLon) * 0.08;
    rotLat += (targetRotLat - rotLat) * 0.08;
    scale  += (targetScale  - scale)  * 0.1;

    drawGlobe();
    requestAnimationFrame(loop);
  }

  // Public
  return {
    init,
    setLocation,
    // Force immediate reset (optional)
    resetView() {
      targetRotLon = -userLon;
      targetRotLat = -userLat * 0.6;
      targetScale = 1;
    }
  };
})();

window.MAP = MAP;
