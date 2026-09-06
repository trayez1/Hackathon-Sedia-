import { db } from "../db/index.js";
import { scoreRoute, STATUS_PENALTY, explainRecommendation } from "./scoring.js";

const CHECKPOINT_TYPES = new Set(["ramp", "lift", "entrance", "stairs", "pavement", "parking"]);

function rowToLocation(row) {
  return { ...row, landmark: !!row.landmark };
}

export function getLocationById(id) {
  const row = db.prepare("SELECT * FROM locations WHERE id = ?").get(id);
  return row ? rowToLocation(row) : null;
}

export function getAllLocations() {
  return db.prepare("SELECT * FROM locations").all().map(rowToLocation);
}

function rowToFeature(row) {
  return {
    id: row.id,
    locationId: row.location_id,
    type: row.type,
    name: row.name,
    status: row.status,
    lastVerified: row.last_verified,
    confirmations: row.confirmations,
    disputes: row.disputes,
    description: row.description || undefined,
  };
}

export function getFeatureById(id) {
  const row = db.prepare("SELECT * FROM features WHERE id = ?").get(id);
  return row ? rowToFeature(row) : null;
}

export function getFeaturesForLocation(locationId) {
  return db.prepare("SELECT * FROM features WHERE location_id = ?").all(locationId).map(rowToFeature);
}

export function getAllFeatures() {
  return db.prepare("SELECT * FROM features").all().map(rowToFeature);
}

export function getPaths() {
  return db.prepare("SELECT location_a, location_b FROM paths").all().map((r) => [r.location_a, r.location_b]);
}

export function getLocationAliases() {
  const rows = db.prepare("SELECT location_id, alias FROM location_aliases").all();
  const byId = {};
  for (const r of rows) (byId[r.location_id] = byId[r.location_id] || []).push(r.alias);
  return byId;
}

function buildGraph() {
  const locations = Object.fromEntries(getAllLocations().map((l) => [l.id, l]));
  const g = {};
  const dist = (a, b) => Math.hypot(locations[a].x - locations[b].x, locations[a].y - locations[b].y);
  getPaths().forEach(([a, b]) => {
    if (!locations[a] || !locations[b]) return;
    const w = dist(a, b);
    (g[a] = g[a] || []).push({ to: b, w });
    (g[b] = g[b] || []).push({ to: a, w });
  });
  return { graph: g, locations };
}

function locationCheckpoints(locationId) {
  return getFeaturesForLocation(locationId).filter((f) => CHECKPOINT_TYPES.has(f.type)).map((f) => f.id);
}

function locationPenalty(locationId) {
  return getFeaturesForLocation(locationId).reduce((sum, f) => {
    const table = STATUS_PENALTY[f.type] || {};
    return sum + (table[f.status] ?? 8);
  }, 0);
}

function shortestPath(graph, originId, destinationId, edgeWeight) {
  const dist = { [originId]: 0 };
  const prev = {};
  const visited = new Set();
  const queue = new Set([originId]);

  while (queue.size) {
    let u = null;
    queue.forEach((n) => { if (u === null || dist[n] < dist[u]) u = n; });
    queue.delete(u);
    if (u === destinationId) break;
    visited.add(u);

    (graph[u] || []).forEach(({ to, w }) => {
      if (visited.has(to)) return;
      const alt = dist[u] + edgeWeight(u, to, w);
      if (dist[to] === undefined || alt < dist[to]) {
        dist[to] = alt;
        prev[to] = u;
        queue.add(to);
      }
    });
  }

  if (dist[destinationId] === undefined) return null;
  const path = [destinationId];
  let cur = destinationId;
  while (cur !== originId) {
    cur = prev[cur];
    path.unshift(cur);
  }
  return path;
}

function buildDynamicRouteDef(graph, locations, originId, destinationId, edgeWeight) {
  const path = shortestPath(graph, originId, destinationId, edgeWeight);
  if (!path) return null;
  let distance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const la = locations[path[i]], lb = locations[path[i + 1]];
    distance += Math.hypot(la.x - lb.x, la.y - lb.y);
  }
  distance = Math.round(distance);
  const duration = Math.max(1, Math.round(distance / 65));
  const checkpoints = path.slice(1).flatMap(locationCheckpoints);
  return { distance, duration, path, checkpoints, notes: [] };
}

function getDynamicRoutes(originId, destinationId) {
  const { graph, locations } = buildGraph();
  if (!graph[originId] && originId !== destinationId) return null;

  const flatWeight = (from, to, w) => w;
  const accessibleWeight = (from, to, w) => w + locationPenalty(to) * 4;

  const fastestDef = buildDynamicRouteDef(graph, locations, originId, destinationId, flatWeight);
  const accessibleDef = buildDynamicRouteDef(graph, locations, originId, destinationId, accessibleWeight);
  if (!fastestDef) return null;

  const fastest = { key: "fastest", label: "Fastest route", ...fastestDef, ...scoreRoute(fastestDef, getFeatureById) };
  const accessible = { key: "accessible", label: "Recommended accessible route", ...(accessibleDef || fastestDef), ...scoreRoute(accessibleDef || fastestDef, getFeatureById) };
  const recommend = accessible.score >= fastest.score ? "accessible" : "fastest";
  const explanation = explainRecommendation(fastest, accessible, recommend);
  return { fastest, accessible, recommend, explanation };
}

function getRouteTemplate(destinationId) {
  const rows = db.prepare("SELECT * FROM route_templates WHERE destination_id = ?").all(destinationId);
  if (rows.length < 2) return null;
  const byKey = {};
  for (const row of rows) {
    byKey[row.route_key] = {
      distance: row.distance,
      duration: row.duration,
      path: JSON.parse(row.path_json),
      checkpoints: JSON.parse(row.checkpoints_json),
      notes: JSON.parse(row.notes_json || "[]"),
    };
  }
  return byKey;
}

/**
 * Mirrors the frontend mock's getRoutesForDestination(): preserves the
 * hand-curated gate routes (with flavor-text notes) when starting from the
 * Main Gate, and falls back to live Dijkstra routing over the path graph for
 * any other origin.
 */
export function getRoutesForDestination(destinationId, originId = "loc-gate") {
  if (!destinationId || destinationId === originId) return null;
  if (!getLocationById(destinationId)) return null;

  const template = originId === "loc-gate" ? getRouteTemplate(destinationId) : null;
  if (template) {
    const build = (key, label) => {
      const def = template[key];
      const scored = scoreRoute(def, getFeatureById);
      return { key, label, distance: def.distance, duration: def.duration, path: def.path, notes: def.notes || [], ...scored };
    };
    const fastest = build("fastest", "Fastest route");
    const accessible = build("accessible", "Recommended accessible route");
    const recommend = accessible.score >= fastest.score ? "accessible" : "fastest";
    const explanation = explainRecommendation(fastest, accessible, recommend);
    return { fastest, accessible, recommend, explanation };
  }

  return getDynamicRoutes(originId, destinationId);
}
