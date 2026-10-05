# v12.5 FIXED - White Gap + Duplicate Title + Scroll + Offline Toast

### Errors Fixed from Screen Recording (v12.4)

**1. White Top Gap (iPhone PWA):**
- Cause: body had `padding-top: env(safe-area-inset-top)` + inner sky container also had `calc(env(safe-area-inset-top)+40px)` = double inset, html background white default = white gap
- Fix: html, body background #020617, body padding 0, sky container single safe-area padding via `.sky-header-fix`

**2. Duplicate Title / Double Rendering:**
- Cause: React StrictMode double mount + scroll-fix style created second header during scroll, version string `2026-05-13-v12-4` duplicated
- Fix: Hidden duplicate h1, fixed version string to `2026-05-13`, single title

**3. Offline Ready Toast Stuck in Middle:**
- Cause: Toast was positioned inside sky flow, not fixed
- Fix: Now fixed bottom center with class `offline-ready-toast`, auto fade out after 3s via animation

**4. Ulaa Cannot Scroll Down (previous):**
- Fixed in v12.4, kept in v12.5: `touch-action: pan-y`, `overflow-y: auto`, `-webkit-overflow-scrolling: touch`

**5. Safari Old Version:**
- Fix: SW v12.5 cache `place-data-v12-5-fixed`, network-first for navigations, deletes all old caches

### Verify
- Header badge: **v12.5 FIXED**
- No white gap on top in standalone PWA (dark #020617 fills notch)
- Single title, single DIGIPIN pill
- Offline Ready toast appears at bottom then disappears after 3s
- Can scroll down fully to moon, sky events, compass
- No duplicate OFFLINE PWA line

### Files
index.html, manifest.json, sw.js, README.md, icon-192.png, icon-512.png

Deploy: Upload all to GitHub main, Cloudflare wait Success, open `?v=125` in Safari typed (not via Facebook fbsbx.com), Add to Home Screen.
