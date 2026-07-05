# Production Deployment

## Architecture

- **Server machine** — runs the Express API (port 3001) + PostgreSQL (port 5433).
  This machine _may also_ run the Electron client app for local use.
- **Client machines** — run only the packaged Electron app, configured to talk
  to the server machine over the LAN.

---

## 1. Server Machine Setup

### Prerequisites

- **macOS** — install via [Homebrew](https://brew.sh/)
- **Windows** — download installers from the official sites

Install the following on the server machine:

| Requirement   | Version | Install (macOS)                    | Install (Windows)                          |
|---------------|---------|------------------------------------|--------------------------------------------|
| Node.js       | 22+     | `brew install node`                | [nodejs.org](https://nodejs.org)           |
| PostgreSQL    | 16+     | `brew install postgresql@16`       | [postgresql.org](https://www.postgresql.org) |

### Start PostgreSQL

**macOS:**
```bash
brew services start postgresql@16
```

**Windows:**
Open "Services" > find "postgresql-x64-16" > Start.

### Create the database

```bash
# Connect and create
psql -U postgres
CREATE DATABASE "faraz-pharmacy";
\q
```

> **Port note**: PostgreSQL must run on port **5433**.  
> If it defaults to 5432, change the port in `postgresql.conf` and restart.

### Clone & configure the server

```bash
git clone <repo-url> /opt/faraz-pharmacy
cd /opt/faraz-pharmacy/server
cp .env.example .env
```

Edit `.env` with your database credentials and a secure JWT secret:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5433/faraz-pharmacy"
JWT_SECRET="generate-a-long-random-string-here"
PORT=3001
```

### Install dependencies & push schema

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

> **`prisma db push`** syncs the schema without migration history (simplest).
> If you prefer tracked migrations, run `npx prisma migrate dev --name init`
> on a development machine and commit the generated `prisma/migrations/`
> folder, then deploy using `npx prisma migrate deploy`.

### Build & start with PM2

```bash
npm run build
npm install -g pm2
pm2 start npm --name "faraz-pharmacy" -- start
pm2 save
pm2 startup
```

The server is now running on `http://<server-ip>:3001`.

### Verify

```bash
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"..."}
```

---

## 2. Client App — Build the Installer

Run this on any machine that has the full repo:

```bash
cd desktop-app
npm install
npm run build
```

This produces an installer in `desktop-app/dist/`:
- **macOS**: `.dmg` file
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` file

Copy the installer to a USB drive.

---

## 3. Install on Client Machines

### Server Machine (dual-server + client)

1. Install the packaged `.dmg` / `.exe`.
2. Launch the app — the **First Launch** screen appears.
3. Click **Server Machine**.
4. The app detects the local IP and shows it to you.
5. Click **Continue to App**.
   - Config saved: `mode: "server"`, `serverUrl: "http://localhost:3001"`
   - The app connects to the local API over localhost.

### Other Client Machines

1. Install the packaged `.dmg` / `.exe`.
2. Launch the app — the **First Launch** screen appears.
3. Click **Client Machine**.
4. Enter the server machine's LAN IP address (e.g. `192.168.1.100`).
5. Click **Connect**.
   - Config saved: `mode: "client"`, `serverUrl: "http://192.168.1.100:3001"`
   - The app connects to the server API over the LAN.

---

## 4. Runtime Configuration

The app resolves the API URL in this order:

1. `window.appConfig.serverUrl` — set by First Launch (Electron only)
2. `VITE_API_URL` env var — set at build time
3. `http://localhost:3001` — fallback for development

> Source: `desktop-app/src/lib/api.ts` — `getApiUrl()` function.

---

## 5. Maintenance

### Restart the server
```bash
pm2 restart faraz-pharmacy
```

### View logs
```bash
pm2 logs faraz-pharmacy
```

### Update the server
```bash
cd /opt/faraz-pharmacy/server
git pull
npm install
npx prisma generate
npx prisma db push          # or npx prisma migrate deploy
npm run build
pm2 restart faraz-pharmacy
```

### Update client machines
Rebuild the installer (`npm run build` in `desktop-app/`) and reinstall on
each client machine. The config file (`~/.faraz-pharmacy/config.json`) is
preserved across reinstalls.
