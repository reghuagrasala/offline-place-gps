# v12.7 FRESH SW - Zero Reload Loop

### Problem: Reload loop continues (reduced intensity)

**Cause of loop in v12.4-v12.6:**
- sw.js: `clients.navigate()` + `controllerchange` reload + `updatefound` reload + `localStorage version check` reload + `setInterval reg.update`
- Even after removing navigate, old SW registrations + controllerchange still triggered reload
- dvh + manipulation caused bounce

**Fresh SW v12.7 Fix:**
1. **Completely fresh sw.js from scratch:**
   - Install: only `skipWaiting()`, no `addAll`
   - Activate: delete all old caches, `clients.claim()` ONLY, NO `client.navigate()`, NO forced reload
   - Fetch: navigate = network first (no loop), assets = cache first
   - NO message handler for SKIP_WAITING loop
   - NO client.matchAll navigate

2. **Fresh registration in index.html:**
   - Only `navigator.serviceWorker.register('./sw.js')` on load
   - NO `controllerchange` listener that reloads
   - NO `updatefound` reload
   - NO `localStorage pwa_version` check reload
   - NO `setInterval reg.update`

3. **Stable CSS:**
   - No dvh, only 100vh
   - No touch-action manipulation, no overscroll-behavior none
   - Simple background #020617, overflow-y auto

**Result:** Zero auto-reload, user controls refresh manually (pull to refresh), no dizziness

**Deploy Steps to Kill Old Looping SW:**
1. GitHub: Upload these 6 files to main (replace)
2. Cloudflare: Wait Success
3. **CRITICAL - Kill old SW on phone:**
   - iPhone: Settings > Apps > Safari > Advanced > Website Data > Search `pages.dev` > Delete All
   - Also search `fbsbx.com` > Delete All (if opened via Messenger)
   - Delete PWA from home screen
   - Restart iPhone (clears SW memory)
   - Safari: Open `https://offline-place-gps.pages.dev/?v=127` typed (NOT via Messenger)
   - Add to Home Screen from this fresh page

**Verify:**
- Badge v12.7 FRESH-SW
- No auto reload, no up-down bounce
- Can touch, scroll down smoothly
- Stable

If still reloads, open Safari DevTools (if possible) and check Console for `[SW v12.7 FRESH]` logs - should see only Install/Activate once, not looping.
