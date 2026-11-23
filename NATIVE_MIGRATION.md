# Going native (Android) with Capacitor

> **Status (v1): done.** The `android/` project exists and `.github/workflows/android.yml` builds a
> debug APK on every push to `main`, published at
> https://github.com/Vinzy0/workout-tower/releases/download/apk/Tower.apk
>
> Already native: haptics (`@capacitor/haptics`), camera (`@capacitor/camera`), Android back
> button (`@capacitor/app`), launcher icons + splash (`node scripts/make-icons.mjs`), no service
> worker inside the app (`src/platform/native.ts`). **Still web-only:** Google Drive sync is hidden
> in the APK until `auth.ts` gets a native sign-in (section 3). `share.ts` still uses a download link.
> For a Play Store release you would also need a signed release build (keystore) instead of debug.

The app is a pure static client: no server code, HashRouter, `dist/` output, and every platform
API lives behind `src/platform/`. Core code never touches `navigator.vibrate`, `window.google`, etc.

## 1. Add Capacitor (already done; kept for reference)

```powershell
npm i @capacitor/core
npm i -D @capacitor/cli
npx cap init Tower com.vinzy0.tower --web-dir dist
npm i @capacitor/android
npx cap add android
```

Build with base `/` (the default when `VITE_BASE` is unset), then copy into the native project:

```powershell
npm run build
npx cap sync android
npx cap open android
```

## 2. Swap these files in `src/platform/`

| File | Web now | Native swap |
|---|---|---|
| `storage.ts` | Dexie / IndexedDB | **Keep as is.** IndexedDB works in the Capacitor WebView. (Optional later: `@capacitor-community/sqlite` behind the same `storage` object.) |
| `haptics.ts` | `navigator.vibrate` | `@capacitor/haptics`: `tick` → `Haptics.selectionChanged()`, `tap` → `impact({ style: ImpactStyle.Light })`, `success` → `notification({ type: NotificationType.Success })`, `heavy` → `impact({ style: ImpactStyle.Heavy })` |
| `share.ts` | download link + file input | `saveFile`: `@capacitor/filesystem` `writeFile` to Cache, then `@capacitor/share` `share({ url })`. `pickTextFile`: keep the file input, or use a file-picker plugin. |
| `auth.ts` | Google Identity Services token popup | **Must change.** See below. |

## 3. Google sign-in on Android (important)

Google blocks OAuth inside embedded WebViews (`disallowed_useragent`), so the web token flow in
`auth.ts` **will not work** in the Capacitor build.

Replace `auth.ts` with a native Google sign-in Capacitor plugin that returns an **OAuth access
token** with the same scope, `https://www.googleapis.com/auth/drive.appdata`. Keep the same
interface:

```ts
export interface Auth {
  readonly available: boolean
  getAccessToken(): Promise<string>
  signOut(): Promise<void>
}
```

You will also need an **Android** OAuth client ID in Google Cloud Console (package name +
SHA-1 of your signing key), in addition to the existing Web client.

`src/sync.ts` (the Drive REST calls via `fetch`) stays exactly the same.

## 4. Other native touches

- Status bar color: `@capacitor/status-bar` → `#0D0D0F`.
- Lock portrait in `android/app/src/main/AndroidManifest.xml` (`android:screenOrientation="portrait"`).
- App icon: reuse `public/pwa-512.png` with Android Studio's Image Asset tool.
- The PWA service worker is harmless in the WebView, but you can skip registering it when
  `Capacitor.isNativePlatform()` is true.
