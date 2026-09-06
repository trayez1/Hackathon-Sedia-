import "dotenv/config";
import { createApp } from "./src/app.js";
import "./src/db/index.js"; // ensures DB is created/migrated/seeded before serving

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`okayUway backend listening on http://localhost:${PORT}`);
  console.log(`  Bootstrap:  GET  http://localhost:${PORT}/api/bootstrap`);
  console.log(`  Live sync:  GET  http://localhost:${PORT}/api/events (SSE)`);
});
