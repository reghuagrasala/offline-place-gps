# v12.8 Stable Fix Black Screen

### Black Screen Issue (your screenshot)
- v12.7 fresh build stripped too much app code (109KB vs 261KB) - React root not rendering = black screen
- Fix: Rebuilt from v12.3 working base (261KB), only removed reload loops surgically, kept app code

### Reload Loop Issue
- v12.4-v12.6 had client.navigate + controllerchange reload + setInterval update
- v12.8: ALL auto-reload removed, only manual refresh

### What Changed
- index.html: 261KB intact, only loop code commented out, fresh minimal SW registration
- sw.js: Ultra minimal, network-first for HTML (prevents black screen from old cache), no navigate
- CSS: Only background #020617 fix, no dvh, no manipulation

### Deploy
1. Upload 6 files to GitHub main
2. Cloudflare wait Success
3. Clear phone: Settings > Safari > Website Data > Delete pages.dev + fbsbx.com, Delete PWA, Restart iPhone
4. Safari typed: https://offline-place-gps.pages.dev/?v=128
5. Should show v12.8 STABLE-FIX-BLACK, content visible (not black), no bounce, scrollable

If black screen persists, open in private tab - if private shows content, old SW cache still there, repeat clear.
