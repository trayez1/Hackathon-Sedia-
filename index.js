import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOCATIONS, LOCATION_ALIASES, PATHS, ROUTE_TEMPLATES,
  buildInitialFeatures, buildInitialReports,
} from "./seed-data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || "./data/okayuway.sqlite";
fs.mkdirSync(path.dirname(path.resolve(DB_PATH)), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
db.exec(schema);

// ---------------------------------------------------------------------------
// Lightweight migrations for columns added after a database already exists
// on disk. `CREATE TABLE IF NOT EXISTS` above is enough for brand-new tables
// (point_transactions, problem_confirmations), but SQLite has no
// `ADD COLUMN IF NOT EXISTS`, so existing `users`/`reports` tables need an
// explicit, idempotent check-then-alter on every boot.
// ---------------------------------------------------------------------------
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`[db] migrated: added ${table}.${column}`);
  }
}

ensureColumn("users", "points", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("reports", "reporter_id", "INTEGER REFERENCES users(id)");
ensureColumn("reports", "reporter_bonus_awarded", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("reports", "resolved_bonus_awarded", "INTEGER NOT NULL DEFAULT 0");

function isEmpty() {
  return db.prepare("SELECT COUNT(*) AS n FROM locations").get().n === 0;
}

function seedDatabase() {
  const insertLocation = db.prepare(
    `INSERT INTO locations (id, name, type, x, y, description, landmark)
     VALUES (@id, @name, @type, @x, @y, @description, @landmark)`
  );
  const insertAlias = db.prepare(
    `INSERT INTO location_aliases (location_id, alias) VALUES (?, ?)`
  );
  const insertPath = db.prepare(
    `INSERT OR IGNORE INTO paths (location_a, location_b) VALUES (?, ?)`
  );
  const insertFeature = db.prepare(
    `INSERT INTO features (id, location_id, type, name, status, last_verified, confirmations, disputes, description)
     VALUES (@id, @locationId, @type, @name, @status, @lastVerified, @confirmations, @disputes, @description)`
  );
  const insertRouteTemplate = db.prepare(
    `INSERT INTO route_templates (destination_id, route_key, distance, duration, path_json, checkpoints_json, notes_json)
     VALUES (@destinationId, @routeKey, @distance, @duration, @pathJson, @checkpointsJson, @notesJson)`
  );
  const insertReport = db.prepare(
    `INSERT INTO reports (id, location_id, feature_id, type, description, photo_url, severity, status, created_at, confirmations, disputes, ai_analysis_json)
     VALUES (@id, @locationId, @featureId, @type, @description, @photoUrl, @severity, @status, @createdAt, @confirmations, @disputes, @aiAnalysisJson)`
  );
  const insertAdmin = db.prepare(
    `INSERT INTO admin_users (name, email, password_hash) VALUES (?, ?, ?)`
  );

  const seedTx = db.transaction(() => {
    for (const loc of LOCATIONS) {
      insertLocation.run({ description: null, landmark: 0, ...loc, landmark: loc.landmark ? 1 : 0 });
      for (const alias of LOCATION_ALIASES[loc.id] || []) insertAlias.run(loc.id, alias);
    }
    for (const [a, b] of PATHS) insertPath.run(a, b);

    for (const f of buildInitialFeatures()) {
      insertFeature.run({ description: null, ...f });
    }

    for (const [destinationId, byKey] of Object.entries(ROUTE_TEMPLATES)) {
      for (const routeKey of ["fastest", "accessible"]) {
        const def = byKey[routeKey];
        insertRouteTemplate.run({
          destinationId,
          routeKey,
          distance: def.distance,
          duration: def.duration,
          pathJson: JSON.stringify(def.path),
          checkpointsJson: JSON.stringify(def.checkpoints),
          notesJson: JSON.stringify(def.notes || []),
        });
      }
    }

    for (const r of buildInitialReports()) {
      insertReport.run({
        id: r.id,
        locationId: r.locationId,
        featureId: r.featureId || null,
        type: r.type,
        description: r.description,
        photoUrl: r.photoUrl || null,
        severity: r.severity,
        status: r.status,
        createdAt: r.createdAt,
        confirmations: r.confirmations,
        disputes: r.disputes,
        aiAnalysisJson: r.aiAnalysis ? JSON.stringify(r.aiAnalysis) : null,
      });
    }

    const adminName = process.env.ADMIN_NAME || "Aisyah (Accessibility Officer)";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@mmu.demo";
    const adminPassword = process.env.ADMIN_PASSWORD || "demo1234";
    insertAdmin.run(adminName, adminEmail, bcrypt.hashSync(adminPassword, 10));
  });

  seedTx();
}

if (isEmpty()) {
  seedDatabase();
  console.log(`[db] Seeded fresh database at ${path.resolve(DB_PATH)}`);
} else {
  console.log(`[db] Using existing database at ${path.resolve(DB_PATH)}`);
}

// Exposed for the admin "reset demo data" endpoint.
export function resetToSeed() {
  const resetTx = db.transaction(() => {
    db.exec(`DELETE FROM problem_confirmations; DELETE FROM point_transactions;
              DELETE FROM reports; DELETE FROM features; DELETE FROM route_templates;
              DELETE FROM location_aliases; DELETE FROM paths; DELETE FROM locations;
              DELETE FROM admin_users; DELETE FROM users;`);
  });
  resetTx();
  seedDatabase();
}
