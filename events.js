import { Router } from "express";
import { addClient, removeClient } from "../services/eventBus.js";

const router = Router();

router.get("/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders?.();
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  addClient(res);
  req.on("close", () => removeClient(res));
});

export default router;
