import { Router } from "express";
import {
  getReports, getReportsForLocation, getReportById, createReport, confirmReport, disputeReport,
  hasUserConfirmed, recordConfirmation, markReporterBonusAwarded,
} from "../services/reportsService.js";
import { awardPoints, POINTS } from "../services/pointsService.js";
import { runAIAnalysis } from "../services/aiAnalysis.js";
import { savePhotoFromDataUrl } from "../services/photoStorage.js";
import { broadcast } from "../services/eventBus.js";
import { requireUser, optionalUser } from "../middleware/auth.js";

const router = Router();

router.get("/reports", optionalUser, (req, res) => {
  res.json(getReports(req.user?.sub ?? null));
});

router.get("/locations/:locationId/reports", (req, res) => {
  res.json(getReportsForLocation(req.params.locationId));
});

// Reporting now requires a signed-in user: points are awarded to a specific
// account, so an anonymous report has no one to credit (and no way to stop
// the same visitor from farming points by re-submitting).
router.post("/reports", requireUser, (req, res) => {
  const { locationId, featureId, type, description, photoDataUrl, aiAnalysis } = req.body || {};
  if (!locationId || !type || !description) {
    return res.status(400).json({ error: "locationId, type, and description are required." });
  }
  if (!photoDataUrl) {
    return res.status(400).json({ error: "Photo evidence is required to submit a report." });
  }

  let photoUrl = null;
  try {
    photoUrl = savePhotoFromDataUrl(photoDataUrl);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  const report = createReport({
    locationId, featureId, type, description, photoUrl, aiAnalysis, reporterId: req.user.sub,
  });
  const pointsAwarded = awardPoints(req.user.sub, POINTS.REPORT_CREATED, "report_created", report.id);
  broadcast({ type: "report_created", reportId: report.id });
  res.status(201).json({ ...getReportById(report.id), pointsAwarded });
});

router.post("/reports/:id/confirm", requireUser, (req, res) => {
  const existing = getReportById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Report not found." });
  if (existing.reporterId === req.user.sub) {
    return res.status(403).json({ error: "You can't confirm your own report." });
  }
  if (hasUserConfirmed(existing.id, req.user.sub)) {
    return res.status(409).json({ error: "You've already confirmed this report." });
  }

  recordConfirmation(existing.id, req.user.sub);
  const report = confirmReport(req.params.id);
  let pointsAwarded = awardPoints(req.user.sub, POINTS.CONFIRM_REPORT, "confirm_report", report.id);

  // First time this report crosses into "verified", credit the original
  // reporter with the confirmation bonus — guarded so it can only ever
  // fire once per report, no matter how many more confirmations arrive.
  if (report.status === "verified" && report.reporterId && !report.reporterBonusAwarded) {
    awardPoints(report.reporterId, POINTS.REPORT_CONFIRMED_BONUS, "report_confirmed_bonus", report.id);
    markReporterBonusAwarded(report.id);
  }

  broadcast({ type: "report_updated", reportId: report.id });
  res.json({ ...getReportById(report.id), pointsAwarded });
});

router.post("/reports/:id/dispute", requireUser, (req, res) => {
  const existing = getReportById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Report not found." });
  const report = disputeReport(req.params.id);
  broadcast({ type: "report_updated", reportId: report.id });
  res.json(report);
});

router.post("/ai-analysis", async (req, res) => {
  const { obstacleType, hasPhoto } = req.body || {};
  const result = await runAIAnalysis({ obstacleType, hasPhoto });
  res.json(result);
});

export default router;
