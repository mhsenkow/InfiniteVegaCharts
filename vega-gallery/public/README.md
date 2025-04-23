# PWA Icons

This directory contains placeholder files for the PWA (Progressive Web App) icons. Before deploying to production, you should replace these with actual image files:

## Required Icons

- `pwa-192x192.png` - A 192×192 pixel PNG image for PWA
- `pwa-512x512.png` - A 512×512 pixel PNG image for PWA
- `apple-touch-icon.png` - A 180×180 pixel PNG image for iOS home screen
- `favicon.ico` - A standard favicon (typically 16×16, 32×32, and 48×48 pixels)
- `masked-icon.svg` - SVG icon with mask support

These files are referenced in:
- `index.html` (favicon.ico, apple-touch-icon.png)
- `manifest.json` (pwa-192x192.png, pwa-512x512.png)
- `vite.config.ts` (all of the above)

Once you replace the placeholders with actual image files, the PWA manifest will work properly and the browser console warnings will disappear. 