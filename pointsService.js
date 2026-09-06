// ============================================================================
// Community point system — the single source of truth for how many points
// an action is worth, what level those points translate to, and how a
// user's running total gets updated. All point-awarding on the backend goes
// through awardPoints() so nothing ever mutates users.points directly, and
// every award leaves a row in point_transactions explaining why it happened.
// ============================================================================
import { db } from "../db/index.js";

// Point values for each qualifying action. Kept in one place so they're easy
// to tune later without hunting through route handlers.
export const POINTS = {
  REPORT_CREATED: 10, // reporting a legitimate accessibility problem
  CONFIRM_REPORT: 5, // confirming someone else's report is still valid
  REPORT_CONFIRMED_BONUS: 15, // reporter's bonus once their report is verified
  REPORT_RESOLVED_BONUS: 10, // reporter's bonus once the problem is resolved
};

// Human-readable labels for the point history / "why did I get this" view.
export const REASON_LABELS = {
  report_created: "Reported an accessibility problem",
  confirm_report: "Confirmed a reported problem",
  report_confirmed_bonus: "Your report was confirmed by another user",
  report_resolved_bonus: "Your report was marked resolved",
};

// Level thresholds. `max: Infinity` on the last tier means "and above" —
// change these numbers (or add tiers) to retune progression later.
export const LEVELS = [
  { name: "Newcomer", min: 0, max: 49 },
  { name: "Contributor", min: 50, max: 149 },
  { name: "Active Contributor", min: 150, max: 299 },
  { name: "Accessibility Advocate", min: 300, max: 499 },
  { name: "Accessibility Champion", min: 500, max: Infinity },
];

export function getLevelInfo(points) {
  const idx = LEVELS.findIndex((l) => points >= l.min && points <= l.max);
  const levelIdx = idx === -1 ? LEVELS.length - 1 : idx;
  const level = LEVELS[levelIdx];
  const next = LEVELS[levelIdx + 1] || null;
  const nextThreshold = next ? next.min : null;
  const progressPercent = next
    ? Math.max(0, Math.min(100, Math.round(((points - level.min) / (next.min - level.min)) * 100)))
    : 100;
  return {
    name: level.name,
    points,
    nextLevelName: next ? next.name : null,
    nextThreshold,
    progressPercent,
  };
}

const insertTx = db.prepare(
  `INSERT INTO point_transactions (user_id, amount, reason, report_id) VALUES (?, ?, ?, ?)`
);
const bumpUserPoints = db.prepare(`UPDATE users SET points = points + ? WHERE id = ?`);

// Awards (or penalizes, if amount is negative) points to a user. Runs as a
// single DB transaction so the ledger row and the cached total can never
// drift apart.
export function awardPoints(userId, amount, reason, reportId = null) {
  if (!userId || !amount) return 0;
  const run = db.transaction(() => {
    insertTx.run(userId, amount, reason, reportId);
    bumpUserPoints.run(amount, userId);
  });
  run();
  return amount;
}

export function getUserPoints(userId) {
  const row = db.prepare("SELECT points FROM users WHERE id = ?").get(userId);
  return row ? row.points : 0;
}

export function getUserStats(userId) {
  const reportsCount = db
    .prepare("SELECT COUNT(*) AS n FROM reports WHERE reporter_id = ?")
    .get(userId).n;
  const confirmedCount = db
    .prepare("SELECT COUNT(*) AS n FROM reports WHERE reporter_id = ? AND status IN ('verified', 'resolved')")
    .get(userId).n;
  const helpfulCount = db
    .prepare("SELECT COUNT(*) AS n FROM problem_confirmations WHERE user_id = ?")
    .get(userId).n;
  return { reportsCount, confirmedCount, helpfulCount };
}

export function getPointHistory(userId, limit = 20, offset = 0) {
  const rows = db
    .prepare(
      `SELECT id, amount, reason, report_id, created_at FROM point_transactions
       WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`
    )
    .all(userId, limit, offset);
  return rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    reason: r.reason,
    reasonLabel: REASON_LABELS[r.reason] || r.reason,
    reportId: r.report_id,
    createdAt: r.created_at,
  }));
}

export function getLeaderboard(limit = 10) {
  const rows = db
    .prepare(`SELECT id, name, points FROM users ORDER BY points DESC, id ASC LIMIT ?`)
    .all(limit);
  return rows.map((u, i) => ({
    rank: i + 1,
    id: u.id,
    name: u.name,
    points: u.points,
    level: getLevelInfo(u.points).name,
  }));
}

export function getUserRank(userId) {
  const me = db.prepare("SELECT points FROM users WHERE id = ?").get(userId);
  if (!me) return null;
  const { rank } = db
    .prepare(`SELECT COUNT(*) + 1 AS rank FROM users WHERE points > ? OR (points = ? AND id < ?)`)
    .get(me.points, me.points, userId);
  return rank;
}
