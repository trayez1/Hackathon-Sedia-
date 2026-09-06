# okayUway

**"Normal maps tell you how to get there. okayUway tells you whether you can actually get there."**

Accessibility-aware navigation for wheelchair users and people with mobility impairments.
Pilot area: **Multimedia University (MMU), Cyberjaya** (demo data only).

## What was built

A working single-page app (not a mockup) implementing the FIND → VERIFY → ROUTE → REPORT → UPDATE loop:

- Landing page with the product pitch and demo stats
- Interactive SVG map of MMU Cyberjaya (15 locations, pedestrian paths)
- Accessibility profile selector (Wheelchair / Mobility impairment; Visual impairment shown as "coming soon")
- Destination search, scoped strictly to the MMU pilot dataset, with an explicit
  "outside pilot area" message for anything else (no fabricated data)
- Accessibility-aware route scoring engine (not shortest-path): every route is scored from
  live feature state — stairs, ramp condition, lift status, pavement condition, entrance
  accessibility, and data freshness — see `src/services/store.js: scoreRoute()`
- Side-by-side Fastest vs. Recommended Accessible route comparison, with the app recommending
  the accessible route even when longer
- Live "Accessibility Warning" banner + "Show alternative route" when the active route crosses
  a broken/blocked feature
- Report an Obstacle flow: type, location, description, **photo upload**, and a **simulated AI
  image analysis step** (clearly labeled as simulated — see below)
- Community verification: Confirm / Dispute buttons, confidence %, "conflicting reports" state,
  auto-escalation to "verified" after 5 confirmations
- Live map + route recalculation: verifying a report immediately downgrades the linked
  accessibility feature, which changes the score of any route depending on it
- Admin dashboard (demo login) with stats, a sortable report table (Verify / Reject / Resolve),
  and an accessibility heatmap ranking locations by report volume
- Accessibility of the app itself: keyboard navigation, focus rings, ARIA labels on the map and
  progress bars, text alongside every icon, no color-only signaling, large touch targets

## Architecture

```
Frontend (React + Vite + Tailwind v4)
        ↓
API client  (src/services/store.js — fetch + Server-Sent Events)
        ↓
Backend (backend/ — Node + Express)
        ↓
Database (SQLite via better-sqlite3 — backend/src/db/)
        ↓
Scoring + routing engine (backend/src/services/scoring.js, routingEngine.js)
        ↓
AI abstraction (backend/src/services/aiAnalysis.js — swappable for a real CV/LLM API)
        ↓
Map (src/components/CampusMap.jsx — SVG, swappable for Mapbox/OSM)
```

This started as a hackathon prototype with everything — API, database, routing, AI — mocked
directly in the browser (`src/services/store.js` + `src/data/seed.js`, backed by
`localStorage`). It's since grown a real backend: `backend/` is a standalone Node + Express
API with a real SQLite database, and `src/services/store.js` is now an actual API client
(`fetch` + Server-Sent Events for live sync) rather than a mock — same exported function
names as before, so the rest of the UI barely changed.

`backend/src/db/seed-data.js` ports the original MMU Cyberjaya demo dataset 1:1, and
`backend/src/services/scoring.js` / `routingEngine.js` port the original scoring/Dijkstra
routing logic line-for-line — same numbers, just computed server-side against real rows now.
`src/data/seed.js` still exists on the frontend purely for static map geometry (building
coordinates, pedestrian-path lines used to draw the SVG); it's no longer the source of truth
for locations/features/reports — the backend's database is.

Data shapes mirror the schema in the brief: `Users` (implicit/anonymous in this demo),
`Locations`, `AccessibilityFeatures`, `Reports`, `Verifications` (confirm/dispute counters),
`Routes` (computed on request via `GET /api/routes`, not stored).

## Completed features (checklist)

- [x] MMU Cyberjaya map (Priority 1)
- [x] Destination search, scoped to pilot + outside-pilot protection (Priority 2)
- [x] Wheelchair accessibility profile (Priority 3)
- [x] Accessibility-aware route scoring, not shortest-path (Priority 4)
- [x] Accessibility score with visual bar + plain-language caveat (Priority 5)
- [x] Report obstacle flow (Priority 6)
- [x] Photo upload with client-side validation (Priority 7)
- [x] AI analysis abstraction, clearly labeled as simulated (Priority 8)
- [x] Community verification (confirm/dispute, confidence, conflicting reports) (Priority 9)
- [x] Admin dashboard with demo login, report table, actions (Priority 10)
- [x] Accessibility heatmap (Priority 11)
- [x] UI polish pass (Priority 12)
- [x] Real backend / DB / auth — Node + Express + SQLite, JWT admin login (see `backend/`)
- [ ] Visual-impairment profile — UI stub only, not implemented (explicitly out of scope for MVP)

## How to run

There are now two things to start: the backend API (with its own SQLite database) and the
frontend. Run them in two terminals.

**1. Backend** (Node + Express + SQLite):

```bash
cd okayuway/backend
npm install
cp .env.example .env
npm run dev
```

This starts the API at `http://localhost:4000` and auto-seeds a fresh SQLite database
(`backend/data/okayuway.sqlite`) with the full MMU Cyberjaya demo dataset on first run. Sanity
check it's up: open `http://localhost:4000/api/bootstrap` — you should get back JSON with
`locations`, `paths`, `features`, and `reports`.

**2. Frontend** (React + Vite):

```bash
cd okayuway
npm install
cp .env.example .env   # only needed if your backend isn't on the default localhost:4000
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`). The app shows a brief
"Loading campus data…" screen while it fetches from the backend on first load; if the backend
isn't running, it shows a "Can't reach the okayUway server" message with a retry button instead
of a blank/broken UI.

To build a production frontend bundle:

```bash
npm run build
npm run preview
```

(The backend is a plain Node process — `npm start` in `backend/` — deploy it wherever you'd
deploy any small Express API.)

## Environment variables

**Frontend** (`okayuway/.env`, see `.env.example`):

```
VITE_API_BASE_URL=http://localhost:4000   # the backend from step 1 above
```

**Backend** (`okayuway/backend/.env`, see `backend/.env.example`):

```
PORT=4000
DB_PATH=./data/okayuway.sqlite
UPLOADS_DIR=./uploads
UPLOADS_URL_PREFIX=/uploads
CORS_ORIGIN=http://localhost:5173         # your frontend dev server / deployed URL
JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=12h
ADMIN_NAME=Aisyah (Accessibility Officer)
ADMIN_EMAIL=admin@mmu.demo
ADMIN_PASSWORD=demo1234                   # only used the FIRST time the DB is created
```

Never commit real secrets — both `.env` files are already covered by `.gitignore`. If you swap
the simulated AI analysis for a real computer-vision/LLM provider, add its API key to
`backend/.env` and call it from `backend/src/services/aiAnalysis.js` — the route handler and
frontend don't need to change.

## Demo credentials

Admin dashboard (`/admin`) — a real JWT-backed login now (`POST /api/admin/login`), seeded
into the database from the backend's `.env` the first time it runs:

```
Email:    admin@mmu.demo
Password: demo1234
```

Change `ADMIN_PASSWORD` in `backend/.env` before this is ever exposed beyond a local demo —
note it's only read on the very first run (when the database is created); changing it later
requires resetting the database or updating the row directly.

## Hackathon demo script (2–3 minutes)

1. **Open** okayUway on the landing page — read the tagline, click **Explore MMU**.
2. **Select** the Wheelchair profile (selected by default).
3. **Search** "Library" and select **MMU Library**.
4. **Show routes**: point out Fastest (400m, 5 min, low score, stairs) vs. **Recommended
   Accessible Route** (650m, 8 min, high score, step-free) — note the app recommends the
   longer route.
5. **The wow moment**: open **Report an Obstacle**, select **Faculty of Engineering (FOE)**,
   pick **Blocked ramp**, upload any photo, click **Run AI accessibility analysis** — show the
   simulated AI detecting an obstruction with HIGH impact — submit.
6. **Live update**: go back to **Explore**, select **FOE** — the accessible route to FOE now
   shows a lower score / warning banner because the ramp feature is scored live.
7. **Admin view**: open **Admin** (demo login above), show the new report in the table with
   AI-assisted severity, click **Verify** — status flips to Verified and feeds back into the map.
8. Close on the heatmap: "this turns okayUway into a data-driven accessibility management tool
   for the university, not just a map for one student."

## Known limitations

- All accessibility data is **demo data** for a hackathon pilot — it is not verified, official
  MMU accessibility information, and should not be used for real navigation decisions.
- Routing from the Main Gate uses precomputed route templates (with live re-scoring from
  feature state); any other starting point falls back to live Dijkstra routing over the
  pedestrian-path graph — see `getRoutesForDestination()` in `backend/src/services/routingEngine.js`.
- The AI image analysis is a deterministic, clearly-labeled simulation, not a real computer
  vision model — see `runAIAnalysis()` in `backend/src/services/aiAnalysis.js`.
- SQLite (via `better-sqlite3`) is fine for a pilot but isn't built for concurrent multi-writer
  production load — swap in Postgres if this goes beyond a demo.
- Visual-impairment support is a UI placeholder, not implemented.
- The backend has no rate limiting or request validation beyond basic required-field checks —
  add both before exposing it outside a local/demo network.

## Future improvements

- Connect `runAIAnalysis` to a real CV/LLM API for genuine obstacle detection
- Replace the stylized SVG map with Mapbox/OSM + real GPS coordinates
- Move from SQLite to Postgres (or Supabase) for real concurrent multi-user load
- Full graph-based routing for every origin, not just the curated Main Gate templates
- Expand beyond the MMU pilot: other universities → Cyberjaya → Kuala Lumpur → Malaysia → ASEAN


## Demo priorities implemented
- **MMU Cyberjaya campus map:** upgraded interactive SVG campus plan with building footprints, pedestrian paths, active route highlighting, obstacle indicators, heatmap, and zoom/reset controls.
- **Destination search:** searches building names, faculty/type names, and common MMU abbreviations; supports Enter-to-select and Escape/clear.
- **Accessibility profile:** wheelchair and mobility profiles are selectable and persist for the current session; visual impairment remains marked as a future profile.
