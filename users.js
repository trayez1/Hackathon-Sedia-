import { Router } from "express";
import { db } from "../db/index.js";
import { requireUser, optionalUser } from "../middleware/auth.js";
import {
  getLevelInfo, getUserStats, getPointHistory, getLeaderboard, getUserRank,
} from "../services/pointsService.js";

const router = Router();

// Current user's profile: identity + points + level + contribution stats +
// a short recent-activity slice. This is what Feature 1/3/4 render from.
router.get("/users/me", requireUser, (req, res) => {
  const user = db.prepare("SELECT id, name, email, points, created_at FROM users WHERE id = ?").get(req.user.sub);
  if (!user) return res.status(404).json({ error: "User not found." });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    memberSince: user.created_at,
    points: user.points,
    level: getLevelInfo(user.points),
    stats: getUserStats(user.id),
    recentActivity: getPointHistory(user.id, 10, 0),
  });
});

// Full, paginated point history (Feature 4) — recentActivity above is just
// the first page of this same data.
router.get("/users/me/history", requireUser, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  res.json({ items: getPointHistory(req.user.sub, limit, offset), limit, offset });
});

// Community leaderboard (Feature 6). Public — usable while logged out —
// but personalizes with the viewer's own rank when a token is present, even
// if they're outside the top N. Only name + points + level are exposed, no
// email or other account details.
router.get("/leaderboard", optionalUser, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const top = getLeaderboard(limit);

  let me = null;
  if (req.user) {
    const row = db.prepare("SELECT id, name, points FROM users WHERE id = ?").get(req.user.sub);
    if (row) {
      me = { rank: getUserRank(row.id), id: row.id, name: row.name, points: row.points, level: getLevelInfo(row.points).name };
    }
  }

  res.json({ top, me });
});

export default router;
