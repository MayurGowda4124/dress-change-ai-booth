# Building the Windows .exe (Electron)

This app can run as a desktop app and be packaged as a Windows `.exe` using Electron.

## Prerequisites

- Node.js (v18 or later)
- **Build the web app first** so the `build/` folder exists

## Commands

```bash
# Install dependencies (includes Electron and electron-builder)
npm install

# Build the React app (required before running or packaging)
npm run build

# Run the app in Electron (development)
npm run electron

# Create the Windows installer (.exe)
npm run electron:build

# Create unpacked app only (no installer, faster)
npm run electron:pack
```

## Output

- **`npm run electron:build`** produces:
  - `release/AI Dress Booth Setup 1.0.0.exe` (NSIS installer)
- **`npm run electron:pack`** produces:
  - Unpacked app in `release/win-unpacked/` (run the `.exe` inside that folder)

## How it works

1. Electron starts the Express server (from `server.js`) on port **2929**.
2. A window opens and loads `http://localhost:2929` (the same React build you get from `npm run build`).
3. All API calls use relative URLs, so they go to the same server inside the app.

## Troubleshooting

- **"Application entry file build\\\\electron.js does not exist"**  
  The project uses `electron/main.js` as the main process. The `package.json` build section has `"extends": null` so electron-builder does not use the react-cra preset. If you see this error, ensure `"extends": null` is present in the `"build"` block.

- **"Cannot create symbolic link : A required privilege is not held by the client"** (winCodeSign)  
  Code signing is disabled by default (`signAndEditExecutables: false`) so the build does not need to extract the winCodeSign package. If you need to sign the .exe, either run the terminal **as Administrator** or enable **Developer Mode** in Windows (Settings → Privacy & security → For developers → Developer Mode), then set `"signAndEditExecutables": true` and configure your certificate.

## .env

The packaged app uses the same environment variables as the web app. For a production build you can set `REACT_APP_*` and `SUPABASE_*` etc. before running `npm run build`; they are baked into the React build. For FitRoom and Supabase, ensure your `.env` is configured before building.
