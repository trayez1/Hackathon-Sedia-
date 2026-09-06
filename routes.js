import { Router } from "express";
import { getRoutesForDestination } from "../services/routingEngine.js";

const router = Router();

// GET /api/routes?destination=loc-foe&origin=loc-gate
router.get("/routes", (req, res) => {
  const { destination, origin } = req.query;
  if (!destination) return res.status(400).json({ error: "destination is required." });
  const result = getRoutesForDestination(destination, origin || "loc-gate");
  if (!result) return res.status(404).json({ error: "No route available for this origin/destination pair." });
  res.json(result);
});

export default router;
