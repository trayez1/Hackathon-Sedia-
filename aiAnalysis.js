// ============================================================================
// AI analysis abstraction.
// IMPORTANT: This is a controlled, deterministic DEMO response, not a real
// computer-vision model — isolated here so a real CV/LLM API call can be
// dropped in later (e.g. calling out to Anthropic/OpenAI vision or a custom
// model) without touching the route handler or the frontend.
// ============================================================================
export async function runAIAnalysis({ obstacleType, hasPhoto }) {
  await new Promise((res) => setTimeout(res, 1400)); // simulate inference latency

  const type = (obstacleType || "").toLowerCase();
  const rampRelated = type.includes("ramp");
  const liftRelated = type.includes("lift");
  const object = rampRelated
    ? "Motorcycle / parked vehicle"
    : liftRelated
    ? "Out-of-service signage"
    : "Obstruction";

  const impact = rampRelated || liftRelated ? "HIGH" : "MEDIUM";

  return {
    simulated: true,
    rampDetected: rampRelated && hasPhoto,
    obstructionDetected: hasPhoto,
    object: hasPhoto ? object : null,
    impact,
    recommendation: hasPhoto
      ? `Temporarily mark this ${rampRelated ? "entrance/ramp" : "feature"} as obstructed until verified by an administrator.`
      : "No photo provided — recommendation based on report type only.",
  };
}
