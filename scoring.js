// ============================================================================
// Accessibility route scoring engine.
// score = 100 - sum(penalties), clamped to [0, 100]. Distance is a soft
// factor (longer accessible detours are expected); stairs, broken lifts,
// blocked ramps, bad pavement, and stale data are hard penalties.
// Ported 1:1 from the original frontend src/services/store.js so scoring
// behaves identically now that it runs server-side against the real DB.
// ============================================================================

export const STATUS_PENALTY = {
  ramp: { good: 0, steep: 18, blocked: 45, damaged: 30, unknown: 10 },
  lift: { working: 0, broken: 45, unknown: 12 },
  entrance: { good: 0, damaged: 25, blocked: 45, unknown: 10 },
  stairs: { good: 20 },
  pavement: { good: 0, damaged: 18, blocked: 40, unknown: 8 },
  parking: { good: 0, damaged: 10, blocked: 25, unknown: 5 },
};

export function freshnessPenalty(iso) {
  const hours = (Date.now() - new Date(iso).getTime()) / 36e5;
  if (hours <= 6) return 0;
  if (hours <= 24) return 2;
  if (hours <= 24 * 7) return 6;
  return 12;
}

export function featurePenalty(feature) {
  const table = STATUS_PENALTY[feature.type] || {};
  return table[feature.status] ?? 8;
}

/**
 * @param {{distance:number, checkpoints:string[]}} routeDef
 * @param {(id:string)=>object|undefined} getFeatureById
 */
export function scoreRoute(routeDef, getFeatureById) {
  const featureSnapshots = routeDef.checkpoints.map((fid) => getFeatureById(fid)).filter(Boolean);
  let penalty = 0;
  const issues = [];
  const goods = [];

  featureSnapshots.forEach((f) => {
    const p = featurePenalty(f);
    penalty += p;
    if (p > 0) issues.push({ feature: f, penalty: p });
    else goods.push(f);
    penalty += freshnessPenalty(f.lastVerified);
  });

  const distancePenalty = Math.min(8, Math.round(routeDef.distance / 200));
  penalty += distancePenalty;

  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const oldestVerification = featureSnapshots.reduce((oldest, f) => {
    const t = new Date(f.lastVerified).getTime();
    return oldest === null || t < oldest ? t : oldest;
  }, null);

  return {
    score,
    issues,
    goods,
    featureSnapshots,
    oldestVerification: oldestVerification ? new Date(oldestVerification).toISOString() : null,
  };
}

/**
 * Builds a plain-language explanation of why `recommend` ("fastest" or
 * "accessible") was chosen, using the same score/issues data already
 * computed for both routes. Attached as `explanation` alongside `recommend`
 * so the frontend can show it without re-deriving anything.
 * @param {{key:string,score:number,issues:Array,distance:number,duration:number}} fastest
 * @param {{key:string,score:number,issues:Array,distance:number,duration:number}} accessible
 * @param {"fastest"|"accessible"} recommend
 */
export function explainRecommendation(fastest, accessible, recommend) {
  const sameRoute = JSON.stringify(fastest.path) === JSON.stringify(accessible.path);

  if (sameRoute) {
    return "The fastest route is also the most accessible one currently available — there isn't a safer alternative to detour through.";
  }

  if (recommend === "accessible") {
    const fastestIssueIds = new Set(fastest.issues.map((i) => i.feature.id));
    const accessibleIssueIds = new Set(accessible.issues.map((i) => i.feature.id));
    const avoided = fastest.issues.filter((i) => !accessibleIssueIds.has(i.feature.id));
    const remaining = accessible.issues.filter((i) => !fastestIssueIds.has(i.feature.id));

    const scoreDiff = accessible.score - fastest.score;
    const extraDistance = accessible.distance - fastest.distance;
    const extraTime = accessible.duration - fastest.duration;

    const parts = [];
    parts.push(`This route scores ${scoreDiff} point${scoreDiff === 1 ? "" : "s"} higher on accessibility than the fastest route (${accessible.score} vs ${fastest.score}).`);

    if (avoided.length > 0) {
      const names = avoided.slice(0, 3).map((i) => i.feature.name).join(", ");
      parts.push(`It avoids ${avoided.length === 1 ? "an issue" : `${avoided.length} issues`} on the fastest route: ${names}.`);
    }
    if (remaining.length > 0) {
      const names = remaining.slice(0, 2).map((i) => i.feature.name).join(", ");
      parts.push(`It does pass ${names}, but that's still a net improvement.`);
    }
    if (extraDistance > 0) {
      parts.push(`In exchange, it's ${extraDistance}m longer (about ${extraTime} extra minute${extraTime === 1 ? "" : "s"}).`);
    } else {
      parts.push("It doesn't even cost you extra distance.");
    }
    return parts.join(" ");
  }

  // recommend === "fastest"
  if (accessible.score <= fastest.score) {
    if (accessible.score === fastest.score) {
      return "Both routes score the same on accessibility, so the fastest one is recommended to save you time and distance.";
    }
    return "The alternate accessible-routing path doesn't actually improve on accessibility here, so the fastest route is recommended.";
  }
  return "The fastest route is recommended since it already scores well on accessibility.";
}
