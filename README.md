# Your Place Data - Offline GPS PWA v12.4 Scroll Fixed

**Fixes Ulaa scroll lock + Safari old cache**

Live: https://offline-place-gps.pages.dev/

### What's Fixed in v12.4

**Ulaa Browser PWA - Cannot Scroll Down (FIXED):**
- Root cause: `touch-action: manipulation` + `overscroll-behavior: none` + `max-height: 100dvh` locked scroll in standalone PWA
- Fix: Changed to `touch-action: pan-y`, `overscroll-behavior-y: auto`, `overflow-y: auto`, `-webkit-overflow-scrolling: touch`, removed fixed height traps
- Added `<style id="scroll-fix-v12-4">` override that forces html/body/#root to be scrollable

**Safari Add to Home Screen Shows Old Version (FIXED):**
- Root cause: Safari PWA keeps old cache `place-data-v7-final-locked` and old `index.html` separate from Safari browser cache. Network-first for navigation requests now.
- Fix: SW v12.4 cache `place-data-v12-4-scroll-fixed` deletes ALL old caches on activate, forces `clients.claim()` + reload, network-first for `index.html` and navigations
- Added version check: `localStorage pwa_version` + auto clear + reload

### Verification
- Header badge must show **v12.4 SCROLL-FIXED**
- Bottom should NOT show old `ON | Blink OFF | Update:2s` bar - only yellow blinks every 10s
- Ulaa PWA: Can scroll down to see all 9 tabs + sky events + moon
- Safari PWA: After delete + reinstall, shows v12.4 not old

### Files
- `index.html` - 261KB - main app
- `manifest.json` - PWA manifest
- `sw.js` - SW v12.4
- `README.md` - this file
- `icon-192.png`, `icon-512.png`

### Deploy
1. Upload all 6 files to GitHub main root
2. Cloudflare Pages - wait green Success
3. Test:
   - Laptop: `https://offline-place-gps.pages.dev/?v=124`
   - Ulaa: Delete PWA > Open `?v=124` > Add to Home Screen > Should scroll
   - Safari: Delete PWA > Settings > Safari > Advanced > Website Data > Delete pages.dev > Open `?v=124` > Add to Home Screen > Should show v12.4

### Previous Fixes Kept
- 2-col layout gap 8px, TIME ZONE/MOON DIST full-width same height grid-column 1/-1
- Yellow results wider 21px scaleX 1.02 scaleY 1.05
- Tiny fonts bright white #FFFFFF
- Title bar +18px, glassy, 24h sky, sky events 60s horizontal, heading compass N badge

Build: v12.4 Scroll Fixed | 2026-05-13
