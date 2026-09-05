# Running okayUway on the Android Emulator

This project is a Vite + React web app with a separate Node backend. To get it
onto an Android emulator as a real installable app (not just a browser tab),
we wrap the built frontend with [Capacitor](https://capacitorjs.com/), which
packages it into a native Android project you open and run in Android Studio.

None of this requires a Mac — Android Studio runs fine on Windows and Linux.

## 0. Prerequisites (one-time setup on your machine)

- **Node.js** 18+ and npm
- **Android Studio** (free): https://developer.android.com/studio
  - On first launch, let it install the Android SDK + an emulator (AVD) —
    the setup wizard walks you through creating one (e.g. "Pixel 8, API 34").
- This repo already has the Capacitor packages listed in `package.json` and
  `capacitor.config.json` committed — you just need to install them.

## 1. Install dependencies

```bash
npm install
```

This pulls in `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android`
(already added to `package.json`).

## 2. Generate the native Android project

This only needs to be done once — it creates an `android/` folder with a
full native Android Studio project that loads your web build.

```bash
npm run android:add
```

## 3. Start the backend

The app still talks to the Express/SQLite backend over HTTP — Capacitor
doesn't change that.

```bash
cd backend
cp .env.example .env      # first time only
npm install
npm run dev                # or: node server.js
```

Leave this running in its own terminal.

## 4. Point the frontend at the backend for the emulator

Copy the root `.env.example` to `.env` and set:

```
VITE_API_BASE_URL=http://10.0.2.2:4000
```

`10.0.2.2` is the Android emulator's special alias for "your computer's
localhost" — plain `localhost` inside the emulator means the emulator
itself, so this step is required.

(If you're instead running on a **physical** Android phone on the same
Wi-Fi, use your computer's LAN IP, e.g. `http://192.168.1.23:4000`, and set
`CORS_ORIGIN` in `backend/.env` to match or to `*` for local testing.)

## 5. Build the web app and sync it into the Android project

Run this every time you change frontend code and want to see it in the app:

```bash
npm run android:sync
```

(This runs `vite build` then `cap sync android`, copying the fresh `dist/`
into the native project.)

## 6. Open and run in Android Studio

```bash
npm run android:open
```

This opens the `android/` folder in Android Studio. Once it finishes
Gradle syncing (first time takes a few minutes), pick your emulator from
the device dropdown and hit ▶ Run. The app installs and launches on the
emulator like any native app.

## Everyday workflow after initial setup

1. `cd backend && npm run dev` (keep it running)
2. Make frontend changes
3. `npm run android:sync`
4. Hit ▶ Run again in Android Studio (or just reopen the app on the emulator)

## Notes / gotchas

- The admin JWT login, obstacle photo uploads, and identity-verification
  document uploads all go over HTTP to the backend exactly as in the
  browser version — no code changes needed there beyond `VITE_API_BASE_URL`.
- If you see a blank white screen in the emulator, it's almost always the
  API base URL — check `adb logcat` or Chrome's `chrome://inspect` (which
  can inspect the emulator's WebView) for the actual fetch error.
- To eventually produce a shareable `.apk`/`.aab`, use Android Studio's
  **Build > Generate Signed Bundle / APK** — this repo doesn't set up
  signing keys for you, since that's a per-developer/publishing decision.
