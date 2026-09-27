# Run Vigil in GitHub Codespaces

You do **not** need to install Node.js on your laptop. The project runs in a cloud VS Code in the browser.

## Steps

### 1. Open the repo

Go to **https://github.com/udhayakumar-96/IT-Compliance-System**

### 2. Create a Codespace

1. Click the green **Code** button
2. Open the **Codespaces** tab
3. Click **Create codespace on main**
4. Wait 1–3 minutes (it installs packages automatically)

Use the **2-core** machine if asked. Free accounts include a monthly Codespaces quota.

### 3. Start the console

In the Codespace terminal (bottom panel):

```bash
npm run dev
```

Wait until you see `Local: http://localhost:8080`.

The terminal also prints a **Vigil Codespace URL**.

### 4. Open the dashboard

1. Open the **Ports** tab (next to Terminal)
2. Find port **8080** (Vigil console)
3. Right-click → **Port Visibility** → **Public**
   (required so the login page can set cookies)
4. Click the **globe** icon (Open in Browser)

A new browser tab opens with Vigil.

### 5. Sign in

1. Click **Create account**
2. Email + password (at least 8 characters)
3. You get the 6 demo Windows devices

Do **not** use Google / X in Codespaces. Use email + password.

Keep the `npm run dev` terminal running. To stop: click that terminal and press **Ctrl+C**.

---

## Viva demo from Codespaces

| Screen | What to show |
|---|---|
| Overview | Fleet score, **Run fleet scan** |
| Devices | Open `HR-WS-12` — expected vs actual |
| Alerts | Resolve a Critical / High alert |
| Policies | Built-in CIS / NIST / ISO + add a custom check |
| Agent | Register a host and show the PowerShell script |

---

## If it fails

| Problem | Fix |
|---|---|
| Create codespace is greyed out | Confirm you are logged into GitHub as **udhayakumar-96** |
| `npm run dev` not found | In the terminal: `cd /workspaces/IT-Compliance-System` then `npm install` then `npm run dev` |
| Sign-in says Invalid origin | Port **8080** must be **Public**, then open it with the **globe**, not `localhost` |
| Blank page | Wait until the terminal says ready, then refresh the forwarded tab |
| Quota exceeded | Wait for the monthly Codespaces hours to reset, or run on your PC with `START-WINDOWS.bat` |

To reopen later: GitHub → this repo → **Code** → **Codespaces** → click the existing codespace (do not create a new one unless the old one was deleted).
