# v12.6 STABLE - Fix Dizziness Bounce

### Error in v12.4 / v12.5: Very Unstable, Going Up and Down Constantly

**Root Cause:**
- sw.js had `clients.forEach(client => client.navigate(client.url + '?v=124'))` on every activate = infinite reload loop
- Main thread had `setInterval(reg.update, 60000)` + `controllerchange` reload = constant reload
- CSS had `min-height: 100dvh` + `100vh` - dvh changes when browser UI hides/shows = layout shift up/down
- `touch-action: manipulation` + `overscroll-behavior: none` + nested `max-height: 100dvh overflow-y: auto` = scroll trap bounce
- `skyShift 18s` animation with filter brightness caused repaints

**Fix in v12.6 STABLE:**
1. Removed `client.navigate()` loop from sw.js - NO auto navigation
2. Removed `setInterval reg.update` - NO auto update every 60s
3. Changed all `100dvh` to `100vh` or `auto`, removed `dvh`
4. Changed `touch-action: manipulation` to `touch-action: auto`
5. Changed `overscroll-behavior: none` to `contain`
6. Removed `skyShift` animation filter, set to static
7. html/body: `overflow-y: auto`, `height: auto`, `position: relative/static`, no fixed traps
8. Background #020617 on html/body/root to fix white gap without safe-area double padding

**Result:** Stable, no bounce, can touch, can scroll down slowly, no dizziness

### Verify
- Badge: v12.6 STABLE
- Open in Safari typed `?v=126` - should be stable, no up-down
- Ulaa PWA - should scroll smoothly down, no bounce
- No auto reload

Build: v12.6 Stable | 2026-05-13
