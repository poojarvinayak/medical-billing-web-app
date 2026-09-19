# Start services locally

This document shows the minimal steps to run the project locally on Windows (MongoDB, backend, frontend). It includes commands that worked for the current workspace.

Prerequisites
- Node.js 20+ and `npm`
- MongoDB installed and running as a Windows service (or accessible via a connection string)
- `mongosh` available for replica set initialization (required for transactions in this project)

1) Start / verify MongoDB

- If MongoDB is installed as a Windows service, ensure it's running:

```powershell
Get-Service -Name MongoDB
```

- If it's stopped, start it:

```powershell
Start-Service -Name MongoDB
```

- Confirm MongoDB listens on the default port and responds to a ping:

```powershell
# TCP test
Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
# mongosh ping
"C:\Users\$env:USERNAME\AppData\Local\Programs\mongosh\mongosh.exe" --eval "db.runCommand({ping:1})"
```

- If you plan to use features that require transactions, initialize a single-node replica set (run once):

```powershell
& 'C:\Users\$env:USERNAME\AppData\Local\Programs\mongosh\mongosh.exe' --eval 'rs.initiate()'
```

2) Start the backend (development)

- Use `npm.cmd` in PowerShell to avoid script execution policy issues. From the project root:

```powershell
Set-Location 'd:\Shri Nandi Medicals\backend'
npm.cmd run dev
```

- The backend uses `backend/.env`. Ensure `MONGODB_URI` points to your MongoDB (default in repo: `mongodb://127.0.0.1:27017/medical-store-billing`).

3) Start the frontend (Vite)

- From the project root start Vite:

```powershell
Set-Location 'd:\Shri Nandi Medicals\frontend'
npm.cmd run dev
```

- By default Vite may bind to the IPv6 loopback (`::1`). If `http://127.0.0.1:5173` does not work but `http://localhost:5173` does, start Vite bound to IPv4 explicitly:

```powershell
npm.cmd --prefix frontend run dev -- --host 127.0.0.1
```

Or to expose on all interfaces:

```powershell
npm.cmd --prefix frontend run dev -- --host 0.0.0.0
```

4) Verify services

- Backend health:

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/health' -UseBasicParsing
```

- Frontend UI:

Open `http://localhost:5173` in a browser (or `http://127.0.0.1:5173` if Vite was started with `--host 127.0.0.1`).

5) Seed development admin user (optional)

```powershell
npm --prefix backend run seed:admin
```

Notes & troubleshooting
- If PowerShell blocks `npm` script execution, prefer `npm.cmd` (native executable) instead of `npm` in PowerShell.
- If `127.0.0.1:5173` returns connection refused but `localhost:5173` works, Vite is bound to `::1` (IPv6). Start Vite with `--host 127.0.0.1` to bind IPv4 explicitly.
- If the backend fails to connect to MongoDB with a `Server selection timed out` error, verify MongoDB is listening on the configured `MONGODB_URI`, and that the replica set has been initiated when transactions are required.
- To make startup easiest for non-technical users, run the entire project from the root with:

```powershell
npm run dev
```

### Stop the dev servers

If the app is running from `npm run dev`, stop it in the same terminal by pressing:

```powershell
Ctrl + C
```

If you run this in PowerShell and `npm run stop` is blocked by execution policy, use:

```powershell
npm.cmd run stop
```

Or run the stop helper directly from the project root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\stop-dev.ps1
```

If that does not stop the servers, close the terminal window. To force-stop any remaining Node processes, run:

```powershell
taskkill /F /IM node.exe /T
```

If you want, I can update the `frontend/package.json` `dev` script to include `--host` permanently. Ask me to make that change and I'll apply it.