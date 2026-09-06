import { Router } from "express";
import { getAllLocations, getLocationById, getPaths, getLocationAliases } from "../services/routingEngine.js";

const router = Router();

router.get("/locations", (req, res) => {
  res.json(getAllLocations());
});

router.get("/locations/:id", (req, res) => {
  const loc = getLocationById(req.params.id);
  if (!loc) return res.status(404).json({ error: "Location not found." });
  res.json(loc);
});

router.get("/paths", (req, res) => {
  res.json(getPaths());
});

router.get("/search", (req, res) => {
  const q = (req.query.q || "").toString().trim().toLowerCase();
  const locations = getAllLocations();
  if (!q) return res.json(locations);

  const aliases = getLocationAliases();
  const terms = q.split(/\s+/).filter(Boolean);
  const results = locations
    .map((l) => {
      const haystack = [l.name, l.type, ...(aliases[l.id] || [])].join(" ").toLowerCase();
      const score = terms.reduce((total, term) => {
        if (l.name.toLowerCase().startsWith(term)) return total + 5;
        if (haystack.includes(term)) return total + 2;
        return total;
      }, 0);
      return { location: l, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.location.name.localeCompare(b.location.name))
    .map((x) => x.location);

  res.json(results);
});

export default router;
