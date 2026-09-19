# Local Setup Guide for the Medical Store Billing System

This project is a full-stack medical store billing application built with:

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- Authentication: JWT + bcryptjs + HTTP-only cookies

This guide explains exactly what is needed to run the project locally on a Windows machine and how to configure it step by step.

---

## 1) Required tools to install

Install the following software before running the project:

### Required

1. Node.js 20 or newer
   - Download from: https://nodejs.org/
   - After install, verify:
     ```powershell
     node -v
     npm -v
     ```

2. MongoDB Community Server
   - Download from: https://www.mongodb.com/try/download/community
   - Make sure MongoDB service is running locally
   - Default local database port is: 27017

3. MongoDB Shell (mongosh)
   - Usually installed with MongoDB tools
   - Needed for replica set setup if the sale/transaction flow is tested

4. Git (optional but recommended)
   - For cloning the project and version control

### Recommended

5. Visual Studio Code
   - Best editor for this project

6. Postman or Thunder Client
   - Useful for testing backend APIs

7. PowerShell
   - Already installed on Windows

---

## 2) Project structure overview

At the root of the workspace, the project contains:

- `frontend/` — React app
- `backend/` — Node.js + Express API
- `package.json` — root scripts to start both services
- `start-dev.ps1` and `stop-dev.ps1` — helper scripts for Windows

The backend uses MongoDB, and the frontend talks to the backend API via the configured base URL.

---

## 3) Open the project in VS Code

Open the project folder in VS Code:

- `d:\Shri Nandi Medicals`

Then open a new terminal in VS Code.

---

## 4) Install project dependencies

From the project root, run:

```powershell
cd "d:\Shri Nandi Medicals"
npm install
```

Then install frontend dependencies:

```powershell
cd frontend
npm install
```

Then install backend dependencies:

```powershell
cd ..\backend
npm install
```

You can also use the root scripts once the project is configured.

---

## 5) Configure MongoDB

### Check whether MongoDB is running

```powershell
Get-Service -Name MongoDB
```

If it is stopped, start it:

```powershell
Start-Service -Name MongoDB
```

Check that MongoDB is listening on the default port:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
```

You can also verify it with mongosh:

```powershell
"C:\Users\$env:USERNAME\AppData\Local\Programs\mongosh\mongosh.exe" --eval "db.runCommand({ping:1})"
```

If your MongoDB is installed in a different location, change the path accordingly.

---

## 6) Add environment files

This project expects environment files for both the frontend and backend.

### Backend environment file

Create a file named:

- `backend/.env`

Use the example file as a template:

- `backend/.env.example`

The project example contains:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/medical-store-billing
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

Create the actual file with this content:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/medical-store-billing
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-long-random-secret-here
JWT_EXPIRES_IN=7d
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

Important notes:

- Replace `JWT_SECRET` with a strong secret string.
- Keep `MONGODB_URI` pointed to your local MongoDB database.
- The default database name used by the app is: `medical-store-billing`
- Do not commit `.env` files to Git in production.

### Frontend environment file

Create a file named:

- `frontend/.env`

Use the example:

- `frontend/.env.example`

The example file contains:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Create the actual file with this content:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

This tells the frontend where the backend API is running.

---

## 7) Start the backend

From the project root, run:

```powershell
cd "d:\Shri Nandi Medicals\backend"
npm run dev
```

The backend uses TypeScript and starts with `tsx watch src/server.ts`.

If the backend starts successfully, you should see a message similar to:

- MongoDB connected successfully
- Server running on port 5000

The API base URL is:

```text
http://localhost:5000
```

### Health check

Open this in a browser or use PowerShell:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/health" -UseBasicParsing
```

Expected response:

```json
{"success":true,"message":"Medical Store Billing API is running"}
```

---

## 8) Start the frontend

Open a second terminal and run:

```powershell
cd "d:\Shri Nandi Medicals\frontend"
npm run dev
```

The frontend uses Vite and runs by default at:

```text
http://localhost:5173
```

If the browser cannot connect on `127.0.0.1:5173`, use:

```powershell
npm run dev -- --host 127.0.0.1
```

This is useful when Vite binds to IPv6 instead of IPv4.

---

## 9) Run the full project together using the root script

This project already includes a root script for Windows:

```powershell
cd "d:\Shri Nandi Medicals"
npm run dev
```

This script runs the helper file `start-dev.ps1`, which can start the MongoDB service, backend, and frontend together.

To stop the app later:

```powershell
cd "d:\Shri Nandi Medicals"
npm run stop
```

Or use:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\stop-dev.ps1
```

---

## 10) Seed the admin user

After MongoDB is running and backend environment variables are set, create the default admin user:

```powershell
cd "d:\Shri Nandi Medicals\backend"
npm run seed:admin
```

This will create the first admin account if it does not already exist.

Default login values from the example:

- Email: `admin@example.com`
- Password: `ChangeMe123!`

Important: change these before using the project in a real environment.

---

## 11) Initial login

Once the frontend and backend are running, open:

```text
http://localhost:5173
```

Then log in using the seeded admin account:

- Email: `admin@example.com`
- Password: `ChangeMe123!`

---

## 12) Important MongoDB requirement for sale transactions

The app supports sales and invoice flows, and those flows may use MongoDB transactions.

For full transaction support, MongoDB should be configured as a replica set.

This project includes a note that local sale completion may require a single-node replica set. If needed, run:

```powershell
"C:\Users\$env:USERNAME\AppData\Local\Programs\mongosh\mongosh.exe" --eval "rs.initiate()"
```

If MongoDB is running as a standalone service without replica set configuration, some transaction-based features may return a service-unavailable style error.

---

## 13) Production build commands

If you want to build the app for production, use:

```powershell
cd "d:\Shri Nandi Medicals"
npm run build
```

This runs:

- frontend build
- backend TypeScript compile

You can also run backend-only build:

```powershell
cd "d:\Shri Nandi Medicals\backend"
npm run build
```

And run the backend production server:

```powershell
cd "d:\Shri Nandi Medicals\backend"
npm start
```

---

## 14) Common troubleshooting

### 1. `npm` command not recognized in PowerShell

Use `npm.cmd` instead of `npm` in some Windows environments:

```powershell
npm.cmd run dev
```

### 2. MongoDB connection failed

Check:

- MongoDB service is running
- `MONGODB_URI` is correct
- The database name exists or can be created
- Port 27017 is open

### 3. Frontend cannot load API

Check `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. JWT authentication issues

Verify that `backend/.env` contains a valid `JWT_SECRET`:

```env
JWT_SECRET=your-long-random-secret-here
```

### 5. Vite binds to IPv6 instead of IPv4

Use:

```powershell
npm run dev -- --host 127.0.0.1
```

---

## 15) Quick start summary

Use the following short version if you want the fastest setup:

```powershell
cd "d:\Shri Nandi Medicals"

# install dependencies
npm install
cd frontend
npm install
cd ..\backend
npm install

# create environment files
# backend/.env
# frontend/.env

# start MongoDB service
Get-Service -Name MongoDB
Start-Service -Name MongoDB

# start backend
cd ..\backend
npm run dev

# start frontend in a second terminal
cd ..\frontend
npm run dev

# create admin user
cd ..\backend
npm run seed:admin
```

Then open:

```text
http://localhost:5173
```

Use the admin login:

- Email: `admin@example.com`
- Password: `ChangeMe123!`

---

## 16) Final notes

This project is designed for local development and testing. For production, you should:

- change the default admin password
- use a strong JWT secret
- use a secure MongoDB connection string
- configure environment variables properly
- disable or remove test credentials from production deployments

This project is ready to run locally once the required tools are installed and the environment files are configured correctly.
