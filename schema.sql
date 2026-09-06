-- okayUway database schema.
-- Mirrors the shapes documented in the frontend README: Locations,
-- AccessibilityFeatures, Reports, Verifications (folded into reports as
-- confirmations/disputes counters), plus route templates and admin users.

CREATE TABLE IF NOT EXISTS locations (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  x           REAL NOT NULL,
  y           REAL NOT NULL,
  description TEXT,
  landmark    INTEGER NOT NULL DEFAULT 0
);

-- Pedestrian path edges between locations (for the campus graph + map lines).
CREATE TABLE IF NOT EXISTS paths (
  location_a TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  location_b TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  PRIMARY KEY (location_a, location_b)
);

-- Location name aliases used by search (e.g. "fci" -> Faculty of Computing).
CREATE TABLE IF NOT EXISTS location_aliases (
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  alias       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS features (
  id            TEXT PRIMARY KEY,
  location_id   TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  type          TEXT NOT NULL, -- ramp | lift | entrance | stairs | pavement | parking
  name          TEXT NOT NULL,
  status        TEXT NOT NULL, -- good|working|broken|blocked|damaged|steep|unknown
  last_verified TEXT NOT NULL,
  confirmations INTEGER NOT NULL DEFAULT 0,
  disputes      INTEGER NOT NULL DEFAULT 0,
  description   TEXT
);

-- Hand-curated fastest/accessible route templates FROM the Main Gate to each
-- destination, preserved for flavor-text notes. Any other origin is routed
-- dynamically at request time over `paths` (see services/routingEngine.js).
CREATE TABLE IF NOT EXISTS route_templates (
  destination_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  route_key      TEXT NOT NULL CHECK (route_key IN ('fastest', 'accessible')),
  distance       INTEGER NOT NULL,
  duration       INTEGER NOT NULL,
  path_json      TEXT NOT NULL,           -- JSON array of location ids
  checkpoints_json TEXT NOT NULL,         -- JSON array of feature ids
  notes_json     TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (destination_id, route_key)
);

CREATE TABLE IF NOT EXISTS reports (
  id            TEXT PRIMARY KEY,
  location_id   TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  feature_id    TEXT REFERENCES features(id) ON DELETE SET NULL,
  type          TEXT NOT NULL,
  description   TEXT NOT NULL,
  photo_url     TEXT,
  severity      TEXT NOT NULL DEFAULT 'MEDIUM',
  status        TEXT NOT NULL DEFAULT 'pending', -- pending|reviewing|verified|rejected|resolved
  created_at    TEXT NOT NULL,
  confirmations INTEGER NOT NULL DEFAULT 1,
  disputes      INTEGER NOT NULL DEFAULT 0,
  ai_analysis_json TEXT
);

CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

-- Regular (non-admin) student/staff accounts used by the public-facing
-- login. Mirrors admin_users but carries its own table + JWT role so a user
-- token can never be swapped in for admin_users' requireAdmin checks.
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Community point system -----------------------------------------------
-- Append-only ledger of every point award. users.points is a running cache
-- of SUM(amount) for this user, kept in sync inside the same DB transaction
-- as each insert here (see services/pointsService.js) so profile/leaderboard
-- reads stay O(1) while this table remains the source of truth for "why".
CREATE TABLE IF NOT EXISTS point_transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  report_id   TEXT REFERENCES reports(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per (report, user) confirmation. The UNIQUE constraint is what
-- actually stops a user from confirming the same report twice / farming
-- points — enforced in the database, not just in application code.
CREATE TABLE IF NOT EXISTS problem_confirmations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id   TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote        TEXT NOT NULL DEFAULT 'confirm',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_features_location ON features(location_id);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(location_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_point_tx_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_report ON problem_confirmations(report_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_user ON problem_confirmations(user_id);
