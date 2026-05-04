# TUMO Interactive Hub (Base)

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Interface is then available at:

- `http://localhost:5173/?player=1`
- `http://localhost:5173/?player=2`

You can also load a specific interface mode through the query string:

- `http://localhost:5173/?interface=door`
- `http://localhost:5173/?interface=door&player=1`
- `http://localhost:5173/?interface=door&player=2`

When using more than one computer to run each player interface, the app must be exposed to the network.

To run the application and expose it to the network:

```bash
npm run dev -- --host
```

Replace `localhost` with the local IP of the computer serving the app:

- `http://<local ip>:5173/?player=1`
- `http://<local ip>:5173/?player=2`

To run both the app with `--host` and the sync server together:

```bash
npm run dev:host:sync
```

## Where students edit

- `change-me/screens.js` (create screens)
- `change-me/actions.js` (define action strings)
- `change-me/theme.js` (colors / typography)

Alternative interface modes can live in their own folder.

- `change-me/` default interface
- `door/` dedicated interface available at `/?interface=door`

## Assets

Put videos in `assets/videos/` and matching thumbnails in `assets/thumbnails/`.

If a gallery screen does not receive items, it will auto-load all videos from `assets/videos/` and will try to match thumbnails by filename (same base name).


Student entry point: `change-me/app.js` (import screens, define actions/flow).
