# Vigil

**Cloud-Based IT Asset Security and Compliance Monitoring System** (MCA project)

Operations console for Windows endpoints. Built-in checks map to **CIS**, **NIST CSF 2.0**, and **ISO 27001:2022**. Admins can add custom organisation checks. Endpoints use a lightweight PowerShell agent (no Osquery / Wazuh).

---

## Easiest way: GitHub Codespaces (no install on your PC)

Full click-by-click guide: **[CODESPACES.md](./CODESPACES.md)**

1. Open this repo on GitHub
2. **Code** → **Codespaces** → **Create codespace on main**
3. Wait for setup, then in the terminal run: `npm run dev`
4. **Ports** tab → port **8080** → visibility **Public** → click the globe
5. **Create account** with email + password

---
## Run on your Windows PC

### 1. Install Node.js 22 LTS

1. Open [https://nodejs.org](https://nodejs.org)
2. Download **22 LTS**
3. In the installer, tick **Add to PATH**
4. Finish, then **close and reopen** Command Prompt / PowerShell

Check it worked:

```bat
node -v
npm -v
```

You should see a version starting with `v22` (or v20+).

### 2. Get this project

**Option A — Git**

```bat
git clone https://github.com/udhayakumar-96/IT-Compliance-System.git
cd IT-Compliance-System
```

**Option B — ZIP**

GitHub → green **Code** → **Download ZIP** → extract → open the folder.

### 3. Start the console

Double-click **`START-WINDOWS.bat`**

Or in Command Prompt inside this folder:

```bat
npm install
npm run dev
```

Wait until the terminal shows it is ready.

### 4. Open the dashboard

In Chrome or Edge go to:

**http://localhost:8080**

1. Click **Create account**
2. Use any email + password (min 8 characters)
3. You land on **Fleet posture** with 6 demo Windows devices

Google / X sign-in is for the hosted Grok preview only. On your PC, use **email + password**.

Keep the black terminal window open while you demo. Close it (or Ctrl+C) to stop.

---

## What to click in the viva

| Screen | What to show |
|---|---|
| **Overview** | Fleet score, **Run fleet scan**, failing CIS/NIST/ISO controls |
| **Devices** | Open `HR-WS-12` or `DEV-WKS-08` — expected vs actual, remediation |
| **Alerts** | Critical / High issues — click **Resolve** |
| **Policies** | Built-in mappings + **Add check** (custom admin policy) |
| **Agent** | Register a hostname, copy token, download `vigil-agent.ps1` |

---

## Optional: scan a real Windows PC

1. In Vigil open **Agent** → register a hostname → copy the token  
2. Copy `public\agent\vigil-agent.ps1` to the PC  
3. PowerShell **as Administrator**:

```powershell
powershell -ExecutionPolicy Bypass -File .\vigil-agent.ps1 -Server http://YOUR-PC-IP:8080 -Token PASTE_TOKEN_HERE
```

On the same PC as the console, `YOUR-PC-IP` can be `localhost`.  
The in-browser **Run fleet scan** button is the simulator if you cannot run the agent.

---

## If something fails

| Problem | Fix |
|---|---|
| `node` is not recognized | Reinstall Node.js 22 with **Add to PATH**, then open a **new** terminal |
| Port already in use | Close other apps using 8080, or stop an old Vigil window |
| Blank page | Wait for `npm run dev` to finish; then refresh http://localhost:8080 |
| Sign-in error "Invalid origin" | Use exactly `http://localhost:8080` (not 127.0.0.1, not another port) |
| `npm install` errors | Delete the `node_modules` folder and run `npm install` again |

---

## Project layout

```
src/routes          Overview, devices, alerts, policies, agent, login
src/lib             Compliance API, CIS/NIST/ISO catalogue, database
public/agent        Windows PowerShell agent
migrations          Auth + devices + checks + alerts schema
```

Database: embedded Postgres (PGLite) on your laptop — no extra install.  
Auth: email/password stored locally. Demo fleet is created on first sign-in.
