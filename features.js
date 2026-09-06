import { Router } from "express";
import { getAllFeatures, getFeaturesForLocation, getFeatureById } from "../services/routingEngine.js";

const router = Router();

router.get("/features", (req, res) => {
  res.json(getAllFeatures());
});

router.get("/features/:id", (req, res) => {
  const f = getFeatureById(req.params.id);
  if (!f) return res.status(404).json({ error: "Feature not found." });
  res.json(f);
});

router.get("/locations/:locationId/features", (req, res) => {
  res.json(getFeaturesForLocation(req.params.locationId));
});

export default router;
