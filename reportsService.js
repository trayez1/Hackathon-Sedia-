import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import { getAllLocations, getFeatureById } from "./routingEngine.js";
import { awardPoints, POINTS } from "./pointsService.js";

function rowToReport(row) {
  return {
    id: row.id,
    locationId: row.location_id,
    featureId: row.feature_id,
    type: row.type,
    description: row.description,
    photoDataUrl: row.photo_url,
    severity: row.severity,
    status: row.status,
    createdAt: row.created_at,
    confirmations: row.confirmations,
    disputes: row.disputes,
    aiAnalysis: row.ai_analysis_json ? JSON.parse(row.ai_analysis_json) : null,
    reporterId: row.reporter_id ?? null,
    reporterBonusAwarded: !!row.reporter_bonus_awarded,
    resolvedBonusAwarded: !!row.resolved_bonus_awarded,
  };
}

// `currentUserId` is optional (bootstrap is reachable without being logged
// in). When present, each report is annotated with per-viewer flags —
// whether this viewer already confirmed it, and whether it's their own
// report — so the frontend can grey out "Confirm" without a second request.
export function getReports(currentUserId = null) {
  const rows = db.prepare("SELECT * FROM reports ORDER BY created_at DESC").all();
  const confirmedByMe = currentUserId
    ? new Set(
        db
          .prepare("SELECT report_id FROM problem_confirmations WHERE user_id = ?")
          .all(currentUserId)
          .map((r) => r.report_id)
      )
    : null;
  return rows.map((row) => {
    const report = rowToReport(row);
    return {
      ...report,
      confirmedByMe: confirmedByMe ? confirmedByMe.has(report.id) : false,
      isOwnReport: currentUserId != null && report.reporterId === currentUserId,
    };
  });
}

export function getReportsForLocation(locationId) {
  return db.prepare("SELECT * FROM reports WHERE location_id = ? ORDER BY created_at DESC").all(locationId).map(rowToReport);
}

export function getReportById(id) {
  const row = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
  return row ? rowToReport(row) : null;
}

export function getConfidence(report) {
  const total = report.confirmations + report.disputes;
  if (total === 0) return 50;
  return Math.round((report.confirmations / total) * 100);
}

export function createReport({ locationId, featureId, type, description, photoUrl, aiAnalysis, reporterId = null }) {
  const severity = aiAnalysis?.impact
    || (type.toLowerCase().includes("lift") || type.toLowerCase().includes("ramp") ? "HIGH" : "MEDIUM");
  const report = {
    id: `rep-${Date.now()}-${randomUUID().slice(0, 8)}`,
    locationId,
    featureId: featureId || null,
    type,
    description,
    photoUrl: photoUrl || null,
    severity,
    status: "pending",
    createdAt: new Date().toISOString(),
    confirmations: 1,
    disputes: 0,
    aiAnalysis: aiAnalysis || null,
    reporterId: reporterId || null,
  };
  db.prepare(
    `INSERT INTO reports (id, location_id, feature_id, type, description, photo_url, severity, status, created_at, confirmations, disputes, ai_analysis_json, reporter_id)
     VALUES (@id, @locationId, @featureId, @type, @description, @photoUrl, @severity, @status, @createdAt, @confirmations, @disputes, @aiAnalysisJson, @reporterId)`
  ).run({
    id: report.id,
    locationId: report.locationId,
    featureId: report.featureId,
    type: report.type,
    description: report.description,
    photoUrl: report.photoUrl,
    severity: report.severity,
    status: report.status,
    createdAt: report.createdAt,
    confirmations: report.confirmations,
    disputes: report.disputes,
    aiAnalysisJson: report.aiAnalysis ? JSON.stringify(report.aiAnalysis) : null,
    reporterId: report.reporterId,
  });
  return getReportById(report.id);
}

export function confirmReport(id) {
  const existing = getReportById(id);
  if (!existing) return null;
  db.prepare("UPDATE reports SET confirmations = confirmations + 1 WHERE id = ?").run(id);
  maybeAutoEscalate(id);
  return getReportById(id);
}

export function disputeReport(id) {
  const existing = getReportById(id);
  if (!existing) return null;
  db.prepare("UPDATE reports SET disputes = disputes + 1 WHERE id = ?").run(id);
  return getReportById(id);
}

// ---------------------------------------------------------------------------
// Confirmation bookkeeping used by the point system. The UNIQUE(report_id,
// user_id) constraint on problem_confirmations is the actual anti-abuse
// backstop here — hasUserConfirmed() is just a friendlier pre-check so the
// route can return a clean 409 instead of a raw constraint-violation error.
// ---------------------------------------------------------------------------
export function hasUserConfirmed(reportId, userId) {
  return !!db
    .prepare("SELECT 1 FROM problem_confirmations WHERE report_id = ? AND user_id = ?")
    .get(reportId, userId);
}

export function recordConfirmation(reportId, userId) {
  db.prepare("INSERT INTO problem_confirmations (report_id, user_id, vote) VALUES (?, ?, 'confirm')").run(
    reportId,
    userId
  );
}

export function markReporterBonusAwarded(reportId) {
  db.prepare("UPDATE reports SET reporter_bonus_awarded = 1 WHERE id = ?").run(reportId);
}

export function markResolvedBonusAwarded(reportId) {
  db.prepare("UPDATE reports SET resolved_bonus_awarded = 1 WHERE id = ?").run(reportId);
}

function maybeAutoEscalate(id) {
  const report = getReportById(id);
  if (report && report.status === "pending" && report.confirmations >= 5) {
    applyVerification(id, "verified");
  }
}

function inferBadStatusForType(featureType, reportType) {
  const t = reportType.toLowerCase();
  if (featureType === "lift") return "broken";
  if (featureType === "ramp") return t.includes("steep") || t.includes("slope") ? "steep" : "blocked";
  if (featureType === "entrance") return t.includes("closed") ? "blocked" : "damaged";
  if (featureType === "pavement") return t.includes("construction") ? "blocked" : "damaged";
  return "damaged";
}

// Admin action: updates report status AND, when verifying, pushes the
// obstruction down into the linked AccessibilityFeature so routes
// recalculate live from the same DB rows the routing engine reads.
export function applyVerification(reportId, status) {
  const report = getReportById(reportId);
  if (!report) return null;

  db.prepare("UPDATE reports SET status = ? WHERE id = ?").run(status, reportId);

  if (status === "verified" && report.featureId) {
    const feature = getFeatureById(report.featureId);
    if (feature) {
      const newStatus = inferBadStatusForType(feature.type, report.type);
      db.prepare(
        `UPDATE features SET status = ?, last_verified = ?, confirmations = ?, disputes = ?, description = ? WHERE id = ?`
      ).run(newStatus, new Date().toISOString(), report.confirmations, report.disputes, report.description, feature.id);
    }
  }
  if (status === "resolved" && report.featureId) {
    const feature = getFeatureById(report.featureId);
    if (feature) {
      const newStatus = feature.type === "lift" ? "working" : "good";
      db.prepare(`UPDATE features SET status = ?, last_verified = ? WHERE id = ?`)
        .run(newStatus, new Date().toISOString(), feature.id);
    }
  }
  if (status === "resolved" && report.reporterId && !report.resolvedBonusAwarded) {
    awardPoints(report.reporterId, POINTS.REPORT_RESOLVED_BONUS, "report_resolved_bonus", reportId);
    markResolvedBonusAwarded(reportId);
  }
  return getReportById(reportId);
}

export function getAdminStats() {
  const reports = getReports();
  return {
    active: reports.filter((r) => r.status !== "resolved").length,
    pending: reports.filter((r) => r.status === "pending").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    highPriority: reports.filter((r) => r.severity === "HIGH" && r.status !== "resolved").length,
  };
}

export function getHeatmapData() {
  const reports = getReports();
  const counts = {};
  reports.forEach((r) => { counts[r.locationId] = (counts[r.locationId] || 0) + 1; });
  return getAllLocations().map((l) => ({ ...l, reportCount: counts[l.id] || 0 }));
}
