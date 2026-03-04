# TUMO Interactive Hub (Base)

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

## Where students edit

- `change-me/screens.js` (create screens)
- `change-me/actions.js` (define action strings)
- `change-me/theme.js` (colors / typography)

## Assets

Put videos in `assets/videos/` and matching thumbnails in `assets/thumbnails/`.

If a gallery screen does not receive items, it will auto-load all videos from `assets/videos/` and will try to match thumbnails by filename (same base name).


Student entry point: `change-me/app.js` (import screens, define actions/flow).
