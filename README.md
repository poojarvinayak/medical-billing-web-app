# Medical Store Billing System

A full-stack medical retail management application built for local billing, medicine inventory tracking, customer management, and invoice generation in a pharmacy workflow.

## Overview

This project provides a practical pharmacy management system with:

- secure admin login and role-based authorization
- medicine inventory management
- customer master records
- POS-style billing workflow
- invoice preview and receipt generation
- MongoDB-backed persistence
- modern React frontend and Express backend

It is designed for local development and internal business use, with a clean architecture that separates frontend, backend, and data layer responsibilities.

---

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Mongoose
- Authentication: JWT + bcryptjs + HTTP-only cookies
- Build tooling: Vite, TypeScript, tsx

---

## Features

### Admin and authentication
- login/logout flow with cookie-based authentication
- protected routes for authenticated users
- role-aware access checks for admin, cashier, and pharmacist actions
- seedable default admin account for local development

### Medicine management
- add, edit, search, list, and soft-delete medicines
- stock awareness and validation for billing workflows
- medicine filtering and pagination

### Customer management
- maintain customer records
- validate Indian mobile number handling
- list and search customers
- add and edit customer profiles

### Billing and sales
- POS-style cart workflow
- medicine quantity validation
- bill calculation engine
- invoice generation for completed sales
- sales history and invoice preview support

---

## Project Structure

```text
medical-store-billing/
├── backend/                 # Express API server
│   ├── src/
│   ├── package.json
│   └── .env.example
├── frontend/                # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── .env.example
├── package.json             # Root scripts for local startup
├── start-dev.ps1            # Windows helper to run app locally
├── stop-dev.ps1             # Windows helper to stop app
├── README.md                # Project overview and setup guide
├── START_SERVICES.md        # Windows local startup steps
└── LOCAL_SETUP_GUIDE.md     # Detailed local setup instructions
```

---

## Prerequisites

Before running the project, make sure you have the following installed:

- Node.js 20 or newer
- npm
- MongoDB Community Server running locally
- mongosh (recommended for MongoDB checks and replica set setup)
- Visual Studio Code (recommended)
- PowerShell (available by default on Windows)

---

## Local Setup

### 1. Clone the project

```bash
git clone <repository-url>
cd "d:\Shri Nandi Medicals"
```

### 2. Install dependencies

From the root directory:

```powershell
npm install
```

Frontend dependencies:

```powershell
cd frontend
npm install
```

Backend dependencies:

```powershell
cd ..\backend
npm install
```

### 3. Configure MongoDB

Ensure MongoDB is running on your machine.

Check the service:

```powershell
Get-Service -Name MongoDB
```

If needed, start it:

```powershell
Start-Service -Name MongoDB
```

Test connectivity:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
```

---

## Environment Configuration

### Backend environment file

Create a file named `backend/.env` based on `backend/.env.example`.

Example:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/medical-store-billing
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

### Frontend environment file

Create a file named `frontend/.env` based on `frontend/.env.example`.

Example:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> Important: Do not commit `.env` files or production credentials to source control.

---

## Run the Application

### Option A: Run backend and frontend separately

Start the backend:

```powershell
cd "d:\Shri Nandi Medicals\backend"
npm run dev
```

Start the frontend in a second terminal:

```powershell
cd "d:\Shri Nandi Medicals\frontend"
npm run dev
```

The app will usually be available at:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Option B: Use the root Windows helper script

```powershell
cd "d:\Shri Nandi Medicals"
npm run dev
```

This uses the project’s helper script to start the services together.

---

## Health Check

After starting the backend, verify the API is running:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/health" -UseBasicParsing
```

Expected response:

```json
{"success":true,"message":"Medical Store Billing API is running"}
```

---

## Seed the Admin User

Once MongoDB is running and the backend's environment is configured, seed the default admin account:

```powershell
cd "d:\Shri Nandi Medicals\backend"
npm run seed:admin
```

Default development credentials:

- Email: admin@example.com
- Password: ChangeMe123!

> Change these values before using the system in a real environment.

---

## Login

Open the frontend in a browser:

```text
http://localhost:5173
```

Use the seeded admin account to sign in.

---

## Production Build

To build the project for production:

```powershell
cd "d:\Shri Nandi Medicals"
npm run build
```

This triggers both frontend and backend build steps.

To run the backend production build directly:

```powershell
cd "d:\Shri Nandi Medicals\backend"
npm run build
npm start
```

---

## Notes on MongoDB Transactions

Some sale and invoice workflows may require MongoDB transactions. For best compatibility, MongoDB should be initialized as a replica set.

In a local Windows setup, run:

```powershell
"C:\Users\$env:USERNAME\AppData\Local\Programs\mongosh\mongosh.exe" --eval "rs.initiate()"
```

If transactions are not configured, some completed-sale features may return a clear service-unavailable message instead of processing the sale.

---

## Troubleshooting

### PowerShell cannot run npm scripts
Use `npm.cmd` in Windows PowerShell:

```powershell
npm.cmd run dev
```

### Frontend cannot open the API
Check `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### MongoDB connection errors
- confirm MongoDB service is running
- verify your `MONGODB_URI`
- ensure port `27017` is reachable

### Vite binds to IPv6 instead of IPv4
Use:

```powershell
npm run dev -- --host 127.0.0.1
```

---

## Useful Commands

```powershell
# root project
npm run dev
npm run stop
npm run build

# frontend
cd frontend
npm run dev
npm run build

# backend
cd backend
npm run dev
npm run build
npm run seed:admin
```

---

## License

This project is intended for local development and internal business use. Please ensure all credentials and environment secrets are handled securely before deployment.

---

## Final Note

This application is ready to run locally once the required tooling is installed and the environment variables are configured properly. For a more detailed walkthrough, see [LOCAL_SETUP_GUIDE.md](LOCAL_SETUP_GUIDE.md) and [START_SERVICES.md](START_SERVICES.md).
