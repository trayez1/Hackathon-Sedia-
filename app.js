import express from "express";
import cors from "cors";
import morgan from "morgan";
import { UPLOADS_DIR } from "./services/photoStorage.js";

import locationsRoutes from "./routes/locations.js";
import featuresRoutes from "./routes/features.js";
import routesRoutes from "./routes/routes.js";
import reportsRoutes from "./routes/reports.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import eventsRoutes from "./routes/events.js";
import { getAllLocations, getPaths, getAllFeatures } from "./services/routingEngine.js";
import { getReports } from "./services/reportsService.js";
import { optionalUser } from "./middleware/auth.js";

export function createApp() {
  const app = express();

  const corsOrigin = (process.env.CORS_ORIGIN || "*").split(",").map((s) => s.trim());
  app.use(cors({ origin: corsOrigin }));
  app.use(morgan("dev"));
  // Base64 photo uploads inflate the JSON body, so allow generous limits.
  app.use(express.json({ limit: "15mb" }));
  app.use(process.env.UPLOADS_URL_PREFIX || "/uploads", express.static(UPLOADS_DIR));

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  // Single call the frontend uses on load to hydrate its local cache
  // (locations, paths, features, reports) in one round trip. optionalUser
  // means a logged-in viewer's reports come back annotated with
  // confirmedByMe/isOwnReport, while a logged-out visitor still gets the
  // full public dataset.
  app.get("/api/bootstrap", optionalUser, (req, res) => {
    res.json({
      locations: getAllLocations(),
      paths: getPaths(),
      features: getAllFeatures(),
      reports: getReports(req.user?.sub ?? null),
    });
  });

  app.use("/api", locationsRoutes);
  app.use("/api", featuresRoutes);
  app.use("/api", routesRoutes);
  app.use("/api", reportsRoutes);
  app.use("/api", adminRoutes);
  app.use("/api", authRoutes);
  app.use("/api", usersRoutes);
  app.use("/api", eventsRoutes);

  app.use((req, res) => res.status(404).json({ error: "Not found." }));
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  });

  return app;
}
