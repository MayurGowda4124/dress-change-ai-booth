# Two-PC setup (main app + Print on another PC)

## Ports

- **3000** – React dev server (front-end), only when you run `npm run frontend`.
- **5000** – Backend (Express) that serves the built app and all APIs. This is the one that must run on the **main PC** and be reachable from the **Print PC**.

## How to run

### Main PC (booth / camera)

1. Build the app once: `npm run build`
2. Start the backend: `npm start` (or `node server.js`). It listens on **port 5000** and on **all interfaces** (`0.0.0.0`), so other machines on the network can connect.
3. Open the app in the browser: **http://localhost:5000** (or **http://\<this-pc-ip\>:5000**).

### Other PC (Print only)

1. Ensure it’s on the same network as the main PC.
2. In the browser, go to: **http://\<main-pc-ip\>:5000/print**  
   Example: if the main PC IP is `192.168.1.10`, use **http://192.168.1.10:5000/print**.
3. The Print page will load and call the backend on the main PC (same origin), so no extra API URL config is needed.

### Finding the main PC IP

- Windows: `ipconfig` → look for “IPv4 Address” (e.g. `192.168.1.10`).
- Use that IP in the URL on the Print PC: `http://192.168.1.10:5000/print`.

### Firewall

If the Print PC cannot load the page, on the **main PC** allow inbound TCP **port 5000** in Windows Firewall (or temporarily turn the firewall off to test).

## Summary

| Where        | What to run        | URL to open                    |
|-------------|--------------------|---------------------------------|
| Main PC     | `npm start` (5000) | http://localhost:5000          |
| Print PC    | Nothing            | http://\<main-pc-ip\>:5000/print |

The backend serves both the React app and the API; the Print page uses relative URLs, so it talks to the same host (the main PC) automatically.
