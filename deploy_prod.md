# Faraz Pharmacy POS — Production Deployment

## Architecture

```
                    SERVER MACHINE
             (Server + optional POS Client)

          ┌──────────────────────────┐
          │ PostgreSQL (port 5433)   │
          │ Express API (port 3001)  │
          │ Windows Service (NSSM)   │
          │ pg_dump backups          │
          │ Electron POS App (opt.)  │
          └───────────┬──────────────┘
                      │
                 LAN (ethernet)
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼

      Client 1    Client 2    Client 3
      Electron    Electron    Electron
      POS App     POS App     POS App
```

- **Server machine** — PostgreSQL + Express API as a Windows Service.
  May also run the Electron POS client for local use.
- **Client machines** — run only the Electron POS app, connected via LAN.

---

## 1. Server Machine — Prerequisites

| Component  | Version | Install                                        |
| ---------- | ------- | ---------------------------------------------- |
| Node.js    | 22 LTS  | [nodejs.org](https://nodejs.org)               |
| PostgreSQL | 16+     | [postgresql.org](https://www.postgresql.org)   |
| Git        | any     | [git-scm.com](https://git-scm.com)             |

> **Important**: Set PostgreSQL port to **5433** during installation (our .env
> uses 5433). If you use the default 5432, you must update `.env` accordingly.

During PostgreSQL setup:
```
Username: postgres
Password: <choose a strong password>
Port:     5433      ← NOT the default 5432
```

---

## 2. Create the Database

Open SQL Shell (psql):

```sql
CREATE DATABASE "faraz-pharmacy";
```

Verify:

```sql
\l
```

---

## 3. Install the Server Application

Extract or clone the server package to a stable location:

```
C:\FarazPharmacy\

├── server          ← Node.js Express API
├── backups         ← pg_dump output
└── logs            ← application logs
```

```bash
cd C:\FarazPharmacy
git clone <repo-url> server
# or extract the server folder manually
```

---

## 4. Configure Environment

Create `C:\FarazPharmacy\server\.env`:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5433/faraz-pharmacy"

JWT_SECRET="replace-with-a-long-random-secret-at-least-32-chars"

PORT=3001

NODE_ENV=production
```

> `JWT_SECRET` must be unique per deployment. Generate one:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 5. Install Dependencies & Generate Prisma Client

```bash
cd C:\FarazPharmacy\server

npm install

npx prisma generate
```

---

## 6. Database Migrations

Since there are no committed migration files yet, initialise them on a
development machine first:

```bash
cd server
npx prisma migrate dev --name init
```

This creates `prisma/migrations/`. Commit and push these files. Then on the
**production server**:

```bash
npx prisma migrate deploy
```

> If you prefer not to track migration history, use instead:
> ```bash
> npx prisma db push
> ```

---

## 7. Seed Initial Data

```bash
npm run db:seed
```

Creates the admin account:

```
Username: admin
Password: admin123
```

> Change the password immediately after first login via
> Settings → Change Password or use the recovery key flow.

---

## 8. Build the Server

```bash
npm run build
```

---

## 9. Install the Express API as a Windows Service

The API must run as a **Windows Service** so it:
- Starts automatically on boot (before any user logs in)
- Survives user logout / restart
- Runs independently of the Electron app

### Install NSSM (Non-Sucking Service Manager)

Download from <https://nssm.cc/download>.

Extract `nssm.exe` to `C:\FarazPharmacy\nssm.exe`.

### Register the Service

Open PowerShell as **Administrator**:

```powershell
C:\FarazPharmacy\nssm.exe install FarazPharmacyAPI
```

A GUI window opens. Fill in:

| Field             | Value                                                               |
| ----------------- | ------------------------------------------------------------------- |
| **Application**   | `C:\Program Files\nodejs\node.exe`                                  |
| **Startup directory** | `C:\FarazPharmacy\server\dist`                                  |
| **Arguments**     | `server.js`                                                         |
| **Service name**  | `FarazPharmacyAPI`                                                  |

On the **Log on** tab, select **Local System account**.

Click **Install service**.

### Start the Service

```powershell
net start FarazPharmacyAPI
```

Or via Services GUI: find `FarazPharmacyAPI` → Start.

Set startup type to **Automatic** in Service properties so it starts on boot.

---

## 10. Configure Windows Firewall

Allow inbound traffic on port 3001 so client machines can reach the API.

PowerShell as Administrator:

```powershell
New-NetFirewallRule `
  -DisplayName "Faraz Pharmacy API" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 3001 `
  -Action Allow
```

Verify the API is reachable:

```bash
curl http://localhost:3001/api/health
```

Expected:

```json
{"status":"ok","timestamp":"2026-07-05T..."}
```

---

## 11. Automatic Database Backups

Create the backup directory:

```
C:\FarazPharmacy\backups\
```

### Backup Script

Create `C:\FarazPharmacy\backups\backup.bat`:

```batch
@echo off
set BACKUP_DIR=C:\FarazPharmacy\backups
set FILENAME=faraz-pharmacy-%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%-%TIME:~0,2%%TIME:~3,2%.sql
set FILENAME=%FILENAME: =0%
"C:\Program Files\PostgreSQL\16\bin\pg_dump" -U postgres -d faraz-pharmacy > "%BACKUP_DIR%\%FILENAME%"
```

> Adjust the PostgreSQL path if your version differs.

### Schedule with Task Scheduler

1. Open **Task Scheduler**
2. Create Task → name `FarazPharmacy Backup`
3. Trigger: **Daily** at 2:00 AM
4. Action: Start program → browse to `C:\FarazPharmacy\backups\backup.bat`
5. Run whether user is logged on or not

Optionally add a second trigger for **hourly** for critical data.

### Cleanup Old Backups

Add script logic to delete backups older than 30 days:

```batch
forfiles -p "%BACKUP_DIR%" -s -m *.sql -d -30 -c "cmd /c del @path"
```

---

## 12. Build the Electron Client Installer

Run this on any machine with the full repo (development machine):

```bash
cd desktop-app
npm install
npm run build
```

This runs `vite build` then `electron-builder`, producing an installer in
`desktop-app/dist/`:

| Platform | Installer         |
| -------- | ----------------- |
| Windows  | `Faraz-*.exe`     |
| macOS    | `Faraz-*.dmg`     |
| Linux    | `Faraz-*.AppImage`|

Copy the installer to a USB drive for distribution.

---

## 13. Install on the Server Machine (Optional Client)

If the server machine also runs the POS client:

1. Run `Faraz-Client-Setup.exe`
2. **First Launch** screen → click **Server Machine**
3. The app detects the local IP and shows it to you
4. Click **Continue to App**

Config saved:

```json
{"mode": "server", "serverUrl": "http://localhost:3001"}
```

The Electron app communicates with the local API over localhost.

---

## 14. Install on Client Machines

1. Run `Faraz-Client-Setup.exe`
2. **First Launch** screen → click **Client Machine**
3. Enter the server machine's LAN IP (e.g. `192.168.1.100`)
4. Click **Connect**

Config saved:

```json
{"mode": "client", "serverUrl": "http://192.168.1.100:3001"}
```

---

## 15. Runtime URL Resolution

The `getApiUrl()` function in `desktop-app/src/lib/api.ts` resolves the
server URL in this order:

1. `window.appConfig.serverUrl` — set by First Launch (Electron only)
2. `VITE_API_URL` env var — set at build time
3. `http://localhost:3001` — development fallback

---

## 16. Server Maintenance

### Restart the API

```powershell
net stop FarazPharmacyAPI
net start FarazPharmacyAPI
```

### View Logs

```
C:\FarazPharmacy\logs\
```

### Check Health

```bash
curl http://localhost:3001/api/health
```

---

## 17. Server Update Procedure

Before each update:

```
1. Backup database (pg_dump)
2. Stop service: net stop FarazPharmacyAPI
3. Update server files (git pull or replace files)
4. Run: npm install
5. Run: npx prisma generate
6. Run: npx prisma migrate deploy   (or npx prisma db push)
7. Run: npm run build
8. Start service: net start FarazPharmacyAPI
9. Verify: curl http://localhost:3001/api/health
```

---

## 18. Client Update Procedure

```bash
cd desktop-app
npm install
npm run build
```

Reinstall on each client machine. The config file and cache at
`%USERPROFILE%\.faraz-pharmacy\` are preserved across reinstalls.

---

## 19. Production Checklist

### Server Machine

- [ ] PostgreSQL installed on port **5433**
- [ ] Database `faraz-pharmacy` created
- [ ] `.env` configured with strong `JWT_SECRET`
- [ ] `npm install` completed
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Migrations applied (`prisma migrate deploy` or `prisma db push`)
- [ ] Seed data inserted (`npm run db:seed`)
- [ ] Server built (`npm run build`)
- [ ] Windows Service registered and started (`FarazPharmacyAPI`)
- [ ] Service startup type set to **Automatic**
- [ ] Firewall rule for port 3001 added
- [ ] Backup script created and scheduled
- [ ] Health endpoint responds (`curl http://localhost:3001/api/health`)
- [ ] Electron client installed (optional — if running POS on same machine)

### Client Machines

- [ ] Electron client installed
- [ ] First Launch: selected **Client Machine**
- [ ] Server IP entered correctly
- [ ] Login successful (admin/admin123)
- [ ] Products list loads
- [ ] Sales workflow tested (add item, checkout, print)
- [ ] Receipt printing tested
