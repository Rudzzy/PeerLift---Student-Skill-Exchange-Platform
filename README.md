# PeerLift

PeerLift is a student skill exchange frontend built with React, Vite, React Router, and Lucide icons.

## Run Locally

Install dependencies:

```powershell
npm.cmd install
```

Start the app:

```powershell
npm.cmd run dev
```

Open the URL printed in the terminal, usually:

```text
http://127.0.0.1:5173
```

If that port is busy, the server automatically tries the next port.

## Scripts

- `npm.cmd run dev` builds and serves the production bundle locally.
- `npm.cmd run build` creates `dist/`.
- `npm.cmd run serve:dist` serves an existing `dist/` build.
- `npm.cmd run dev:vite` starts Vite dev mode directly.

`dev` intentionally serves the built app because Vite's dependency optimizer can fail on some Windows folders with protected parent directories.

## Main Files

- `src/main.jsx` contains the pages, layouts, routes, and demo data.
- `src/styles.css` contains the responsive UI system.
- `scripts/serve-dist.mjs` serves the built app without extra dependencies.
