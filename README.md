# okayUway backend

A real REST API + SQLite database for okayUway, ported from the original
frontend mock (`src/services/store.js` + `src/data/seed.js`). Same scoring
engine, same routing logic, same demo dataset — now backed by an actual
database instead of `localStorage`.

## Status

This backend is complete and functional on its own (you can hit every
endpoint with curl/Postman right now). **The frontend has not been wired up
to it yet** — `src/services/store.js` still talks to `localStorage`. That
rewire is the next step; this backend is designed so that swap will be a
single-file change on the frontend side, since every endpoint mirrors a
function that already exists in the mock store.

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev       # http://localhost:4000, auto-restarts on file changes
# or: npm start
```

The SQLite database file is created automatically (default: `backend/data/okayuway.sqlite`)
and seeded with the full MMU Cyberjaya demo dataset on first run.

Default admin login (change `ADMIN_PASSWORD` in `.env` before this is ever
public): `admin@mmu.demo` / `demo1234`.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/bootstrap` | — | Locations + paths + features + reports in one call |
| GET | `/api/locations` | — | All locations |
| GET | `/api/locations/:id` | — | One location |
| GET | `/api/paths` | — | Pedestrian path edges |
| GET | `/api/search?q=` | — | Destination search (name/type/alias) |
| GET | `/api/features` | — | All accessibility features |
| GET | `/api/features/:id` | — | One feature |
| GET | `/api/locations/:id/features` | — | Features at a location |
| GET | `/api/routes?destination=&origin=` | — | Fastest + accessible scored routes |
| GET | `/api/reports` | — | All reports (newest first) |
| GET | `/api/locations/:id/reports` | — | Reports at a location |
| POST | `/api/reports` | — | Submit a report (`{locationId, featureId?, type, description, photoDataUrl?, aiAnalysis?}`) |
| POST | `/api/reports/:id/confirm` | — | Community confirm (auto-verifies at 5 confirmations) |
| POST | `/api/reports/:id/dispute` | — | Community dispute |
| POST | `/api/ai-analysis` | — | Simulated obstacle-photo analysis |
| POST | `/api/admin/login` | — | `{email, password}` → `{token, name, email}` |
| POST | `/api/admin/reports/:id/status` | Bearer token | `{status}` — verify/reject/resolve, cascades to feature status |
| GET | `/api/admin/stats` | — | Dashboard counters |
| GET | `/api/admin/heatmap` | — | Report counts per location |
| POST | `/api/admin/reset` | Bearer token | Reset DB to seed data |
| GET | `/api/events` | — | Server-Sent Events stream for live cross-tab/device sync |
| POST | `/api/auth/register` | — | `{name, email, phone, password, selfieDataUrl, idDocumentDataUrl, consent}` → account created with `verificationStatus: "pending"` |
| POST | `/api/auth/login` | — | `{email, password}` → `{token, ...profile}` |
| GET | `/api/auth/me` | Bearer token (user) | Live profile + verification status for the logged-in account |
| GET | `/api/admin/users/pending` | Bearer token (admin) | Accounts awaiting identity verification (metadata only) |
| GET | `/api/admin/users/:id` | Bearer token (admin) | One account's verification detail (metadata only) |
| GET | `/api/admin/users/:id/document/selfie` \| `/id` | Bearer token (admin) | Streams the stored selfie/ID photo |
| POST | `/api/admin/users/:id/verify` | Bearer token (admin) | Approve verification, records which admin approved it |
| POST | `/api/admin/users/:id/reject` | Bearer token (admin) | Reject verification, records which admin rejected it |
| POST | `/api/admin/verification/cleanup` | Bearer token (admin) | Deletes selfie/ID files past the retention window (see below) |

`POST /api/reports` now requires a logged-in user (`Authorization: Bearer <user token>`); the reporting account is taken from the token, never from the request body.

Uploaded obstacle photos are decoded from the base64 data URL the frontend
already produces and saved under `backend/uploads/`, served at `/uploads/…`.

## Architecture notes

- `src/db/schema.sql` + `src/db/seed-data.js` + `src/db/index.js` — schema,
  seed dataset (ported 1:1 from `src/data/seed.js`), and migration/seeding.
- `src/services/scoring.js` + `routingEngine.js` — the accessibility scoring
  engine and Dijkstra-based dynamic routing, ported 1:1 from the frontend
  mock's `scoreRoute()` / graph logic, now reading live feature status from
  SQLite.
- `src/services/reportsService.js` — report lifecycle: creation, confirm/
  dispute, auto-escalation at 5 confirmations, and admin verification
  (which downgrades the linked feature's status so routes re-score live).
- `src/services/eventBus.js` + `routes/events.js` — SSE broadcast so a
  report submitted on one device shows up live on another.

- `src/services/secureDocumentStorage.js` + `src/services/usersService.js` —
  identity-verification document storage and account/verification state
  (see below).

## Identity verification — what this implements, and what it doesn't

Registration collects a selfie and a photo of an ID document and stores the
account as `verificationStatus: "pending"`. **This is document/selfie
_submission_, not proof of identity.** Nothing in this codebase confirms the
photo is a genuine, unaltered ID, that the selfie matches it, or that either
belongs to the person registering — that requires a real identity-verification
provider (e.g. a liveness-check + document-authenticity API), which is not
wired up here. An admin manually reviewing the two photos in the dashboard
and clicking Approve/Reject is the only check in this build.

Storage/security choices worth knowing before deploying this anywhere real:

- Selfie/ID files are written to `SECURE_UPLOADS_DIR` (default
  `backend/secure-uploads/`), which is never mounted with `express.static`
  and is `.gitignore`d. The only way to read one back is
  `GET /api/admin/users/:id/document/:kind`, which requires an admin JWT.
  Files are written with `0600` permissions, but the directory itself is
  plain local disk — for production, put this behind actual encryption at
  rest (e.g. an S3 bucket with server-side encryption + a private ACL) and a
  host that isn't shared with anything else.
- `POST /api/admin/verification/cleanup` deletes documents past
  `VERIFICATION_DOCUMENT_RETENTION_DAYS` (default 30) for accounts that have
  already been verified or rejected — but nothing calls it automatically.
  Wire it to a cron/scheduled job before relying on it as an actual
  retention policy.
- No claim is made anywhere in this code about compliance with a specific
  privacy law (GDPR, PDPA, etc.) — that needs an actual legal/compliance
  review of the real deployment, not just this implementation.
- `admin_users`/JWT auth here is the same lightweight setup used for the
  rest of this demo backend (see `.env.example`) — rotate `JWT_SECRET` and
  put real access controls around who gets an admin account before this
  goes anywhere near real users' ID documents.

## Not done yet

- Frontend (`src/services/store.js`) still needs to be rewritten to call
  this API instead of `localStorage`, plus small edits to a handful of
  components that currently call store functions synchronously.
- A scheduled job to actually run the verification-document retention
  cleanup (see above) instead of it being an admin-triggered endpoint.
