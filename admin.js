import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, resetToSeed } from "../db/index.js";
import { applyVerification, getAdminStats, getHeatmapData } from "../services/reportsService.js";
import { requireAdmin } from "../middleware/auth.js";
import { broadcast } from "../services/eventBus.js";

const router = Router();

const VALID_STATUSES = new Set(["pending", "reviewing", "verified", "rejected", "resolved"]);

router.post("/admin/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password are required." });

  const admin = db.prepare("SELECT * FROM admin_users WHERE email = ?").get(email);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = jwt.sign(
    { sub: admin.id, email: admin.email, name: admin.name, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
  );
  res.json({ token, name: admin.name, email: admin.email });
});

router.post("/admin/reports/:id/status", requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: `status must be one of: ${[...VALID_STATUSES].join(", ")}` });
  }
  const report = applyVerification(req.params.id, status);
  if (!report) return res.status(404).json({ error: "Report not found." });
  broadcast({ type: "report_updated", reportId: report.id });
  res.json(report);
});

router.get("/admin/stats", (req, res) => {
  res.json(getAdminStats());
});

router.get("/admin/heatmap", (req, res) => {
  res.json(getHeatmapData());
});

router.post("/admin/reset", requireAdmin, (req, res) => {
  resetToSeed();
  broadcast({ type: "full_refresh" });
  res.json({ ok: true });
});

export default router;
