# v12.9 STABLE LAYOUT - Fix Top Blank + Bottom Strip

### Issues from screenshots v12.8:
1. **Top blank space:** Large dark navy/black area above pink sky gradient (image_7BCBA195)
   - Cause: `env(safe-area-inset-top)` + body background #020617 + sky padding calc = double padding, sky gradient starts below status bar
   - Fix: Removed ALL `env(safe-area-inset-*)` -> replaced with 0px, body padding 0, sky margin-top 0, padding-top 12px only

2. **Bottom blank strip:** Large dark area after sky events, after last card (image_6CA31228, image_958BE917)
   - Cause: `min-height: 100dvh` + `env(safe-area-inset-bottom)` padding on body and inner containers = extra blank at bottom when content ends
   - Fix: Removed safe-area bottom padding, set html/body min-height 100% not dvh, #root min-height 100vh, last child margin-bottom 0, padding-bottom 20px only

### Fixes:
- html, body { background: #020617, margin:0, padding:0, width:100%, height:auto }
- #root { background:#020617, min-height:100vh, overflow visible }
- Sky header starts at top 0, no dark gap
- No dvh, no safe-area double padding, no manipulation
- SW v12.9 fresh, no reload loop (kept from v12.8)

### Verify:
- Badge v12.9 STABLE-LAYOUT
- Top: pink sky starts immediately under status bar, no dark blank
- Bottom: after sky events, no large dark strip, content ends cleanly
- Stable, no up-down bounce, scrollable

Deploy: Upload 6 files to GitHub main, Cloudflare Success, clear Safari Website Data pages.dev+fbsbx.com, restart iPhone, open typed https://offline-place-gps.pages.dev/?v=129
