# Google Drive setup (what the app expects)

The app backs up to Google Drive's hidden **application data folder**. It runs entirely in the
browser (Google Identity Services token model, no backend). Until a client ID is set, the Drive
section in Settings is hidden and everything else works normally.

## What to create in Google Cloud Console

1. A project with the **Google Drive API** enabled.
2. An **OAuth consent screen**. Add this single scope:
   - `https://www.googleapis.com/auth/drive.appdata`
   While the app is in "Testing" mode, add your Google account as a test user.
3. An **OAuth client ID** of type **Web application** with these
   **Authorized JavaScript origins** (origins only, no path):
   - `https://vinzy0.github.io`
   - `http://localhost:5173`
   No redirect URIs are needed (the token model uses a popup).

## Where the client ID goes

| Where | Name | Value |
|---|---|---|
| Local dev | `.env.local` (copy `.env.example`) | `VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com` |
| GitHub Pages build | Repo → Settings → Secrets and variables → Actions → **Variables** | `VITE_GOOGLE_CLIENT_ID` |

It is a public client ID, not a secret, so a repository *variable* is fine. Or from a terminal:

```powershell
gh variable set VITE_GOOGLE_CLIENT_ID --body "xxxx.apps.googleusercontent.com" --repo Vinzy0/workout-tower
```

After setting the variable, re-run the deploy (push anything, or Actions → Deploy → Run workflow).

## What the app stores

One file, `workout-data.json`, in the appDataFolder: presets, exercises, sessions, goal history,
settings, and `updatedAt`. Sync merges by record id + `updatedAt`, so nothing is lost when two
devices both have changes. Deletes are soft (`deleted: true`) so they sync too.

Tokens are short-lived and only requested from a tap (Connect, Sync now, Finish workout).
