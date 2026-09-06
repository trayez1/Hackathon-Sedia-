// ============================================================================
// okayUway API client.
//
// This module used to be an in-memory mock (localStorage-backed). It now
// talks to the real backend/ Express + SQLite API. Every function keeps its
// original name and, where possible, its original synchronous signature —
// so most components didn't need to change. The two things that genuinely
// can't stay synchronous now that scoring/routing runs server-side are
// route lookups (getRoutesForDestination) and write actions (submitReport,
// confirmReport, disputeReport, adminSetStatus, resetDemoData, adminLogin) —
// those are called the same way but are now async / cache-then-fetch.
//
// Data flow: on load we fetch /api/bootstrap once to hydrate a local cache
// (locations, paths, features, reports), then keep an SSE connection to
// /api/events open; any server-side change (new report, admin verification,
// reset) re-fetches bootstrap and notifies subscribers, so every open tab
// stays live-synced — the same job localStorage + the emit()/subscribe()
// pair used to do for a single tab.
// ============================================================================

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const API = `${API_BASE}/api`;

const ADMIN_SESSION_KEY = "okayuway_admin_session_v1";
const USER_SESSION_KEY = "okayuway_user_session_v1";

const state = {
  locations: [],
  locationsById: {},
  paths: [],
  features: [],
  reports: [],
  adminToken: null,
  adminName: null,
  adminEmail: null,
  userToken: null,
  userName: null,
  userEmail: null,
};

let ready = false;
let bootstrapError = null;
const listeners = new Set();

function emit() {
  listeners.forEach((cb) => cb());
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function isReady() { return ready; }
export function getBootstrapError() { return bootstrapError; }

// Report photos are stored on the backend and returned as relative paths
// (e.g. "/uploads/169...-abcd1234.jpg"), served by its static /uploads route
// — not the /api prefix — so build the full URL against API_BASE.
export function getPhotoUrl(path) {
  return path ? `${API_BASE}${path}` : null;
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------
async function fetchJSON(path, opts = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    });
  } catch (e) {
    throw new Error(`Could not reach the okayUway server at ${API_BASE}. Is the backend running?`);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* non-JSON error body */ }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

function authHeaders() {
  return state.adminToken ? { Authorization: `Bearer ${state.adminToken}` } : {};
}

function userAuthHeaders() {
  return state.userToken ? { Authorization: `Bearer ${state.userToken}` } : {};
}

// ---------------------------------------------------------------------------
// Bootstrap + live sync
// ---------------------------------------------------------------------------
const routeCache = new Map(); // "originId::destinationId" -> { status: 'loading'|'ready'|'none', data? }

export async function loadBootstrap() {
  try {
    const data = await fetchJSON("/bootstrap");
    state.locations = data.locations;
    state.locationsById = Object.fromEntries(data.locations.map((l) => [l.id, l]));
    state.paths = data.paths;
    state.features = data.features;
    state.reports = data.reports;
    ready = true;
    bootstrapError = null;
    routeCache.clear(); // feature/report changes can change route scores
  } catch (e) {
    bootstrapError = e;
  }
  emit();
}

export function retryBootstrap() {
  return loadBootstrap();
}

let bootstrapPromise = loadBootstrap();
export function whenReady() { return bootstrapPromise; }

function connectEvents() {
  if (typeof window === "undefined" || typeof EventSource === "undefined") return;
  try {
    const es = new EventSource(`${API}/events`);
    es.onmessage = () => { loadBootstrap(); };
    // EventSource auto-reconnects on error; nothing else to do here.
  } catch (e) { /* SSE unsupported/blocked — app still works, just without live push */ }
}
connectEvents();

// restore an admin session across page refreshes
try {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    state.adminToken = parsed.token || null;
    state.adminName = parsed.name || null;
    state.adminEmail = parsed.email || null;
  }
} catch { /* ignore corrupted/blocked storage */ }

// restore a regular-user session across page refreshes
try {
  const raw = localStorage.getItem(USER_SESSION_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    state.userToken = parsed.token || null;
    state.userName = parsed.name || null;
    state.userEmail = parsed.email || null;
  }
} catch { /* ignore corrupted/blocked storage */ }

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------
export function getLocations() { return state.locations; }
export function getPaths() { return state.paths; }
export function getLocationById(id) { return state.locationsById[id] || null; }

const LOCATION_ALIASES = {
  "loc-library": ["library", "lib", "books"],
  "loc-fci": ["fci", "computing", "informatics"],
  "loc-foe": ["foe", "engineering", "engineer"],
  "loc-fom": ["fom", "management", "business"],
  "loc-fca": ["fca", "cinematic", "cinema", "film"],
  "loc-dtc": ["dtc", "dewan tun canselor", "auditorium", "hall"],
  "loc-admin": ["chancery", "admin", "administration"],
  "loc-cafeteria": ["cafe", "cafeteria", "food", "canteen"],
  "loc-studentcentre": ["student centre", "student center", "students"],
  "loc-sports": ["sports", "sport", "multipurpose", "hall"],
  "loc-hostel": ["hostel", "residential", "college", "block c"],
  "loc-clinic": ["clinic", "health", "wellness"],
  "loc-parking": ["parking", "oku parking", "car park"],
  "loc-gate": ["gate", "entrance", "main gate"],
  "loc-bestari": ["bestari", "lecture hall"],
};

// Local, synchronous search over the cached location list — kept
// client-side (rather than hitting GET /api/search) so search-as-you-type
// stays instant. Mirrors the backend's own alias-based scoring exactly.
export function searchLocations(query) {
  const q = query.trim().toLowerCase();
  const locations = state.locations;
  if (!q) return locations;
  const terms = q.split(/\s+/).filter(Boolean);
  return locations
    .map((l) => {
      const haystack = [l.name, l.type, ...(LOCATION_ALIASES[l.id] || [])].join(" ").toLowerCase();
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
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------
export function getFeatureById(id) { return state.features.find((f) => f.id === id) || null; }
export function getFeaturesForLocation(locationId) {
  return state.features.filter((f) => f.locationId === locationId);
}
export function getAllFeatures() { return state.features; }

// ---------------------------------------------------------------------------
// Routes — scoring/routing now runs server-side (GET /api/routes), so this
// is a synchronous cache read that kicks off a fetch on a cache miss.
// Returns:
//   null              -> no route available for this origin/destination
//   { loading: true } -> request in flight, not yet resolved
//   { fastest, accessible, recommend } -> resolved route data
// ---------------------------------------------------------------------------
export function getRoutesForDestination(destinationId, originId = "loc-gate") {
  if (!destinationId || destinationId === originId) return null;
  const key = `${originId}::${destinationId}`;
  const entry = routeCache.get(key);

  if (!entry) {
    routeCache.set(key, { status: "loading" });
    fetchRoutes(destinationId, originId, key);
    return { loading: true };
  }
  if (entry.status === "loading") return { loading: true };
  if (entry.status === "none") return null;
  return entry.data;
}

async function fetchRoutes(destinationId, originId, key) {
  try {
    const data = await fetchJSON(`/routes?destination=${encodeURIComponent(destinationId)}&origin=${encodeURIComponent(originId)}`);
    routeCache.set(key, { status: "ready", data });
  } catch (e) {
    routeCache.set(key, { status: "none" });
  }
  emit();
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export function getReports() { return state.reports; }
export function getReportsForLocation(locationId) {
  return state.reports.filter((r) => r.locationId === locationId);
}

export async function submitReport({ locationId, featureId, type, description, photoDataUrl, aiAnalysis }) {
  const report = await fetchJSON("/reports", {
    method: "POST",
    headers: userAuthHeaders(),
    body: JSON.stringify({ locationId, featureId: featureId || null, type, description, photoDataUrl, aiAnalysis }),
  });
  await loadBootstrap();
  return report;
}

export async function confirmReport(reportId) {
  const report = await fetchJSON(`/reports/${encodeURIComponent(reportId)}/confirm`, {
    method: "POST",
    headers: userAuthHeaders(),
  });
  await loadBootstrap();
  return report;
}

export async function disputeReport(reportId) {
  const report = await fetchJSON(`/reports/${encodeURIComponent(reportId)}/dispute`, {
    method: "POST",
    headers: userAuthHeaders(),
  });
  await loadBootstrap();
  return report;
}

export function getConfidence(report) {
  const total = report.confirmations + report.disputes;
  if (total === 0) return 50;
  return Math.round((report.confirmations / total) * 100);
}

// ---------------------------------------------------------------------------
// AI analysis — simulated on the backend now (src/services/aiAnalysis.js
// there), unchanged in behavior from the original in-browser mock.
// ---------------------------------------------------------------------------
export async function runAIAnalysis({ obstacleType, hasPhoto }) {
  return fetchJSON("/ai-analysis", {
    method: "POST",
    body: JSON.stringify({ obstacleType, hasPhoto }),
  });
}

// ---------------------------------------------------------------------------
// Admin dashboard aggregates — computed client-side from the same cached
// reports/locations bootstrap already holds, so these stay synchronous
// exactly like the original mock (no need to hit /api/admin/stats or
// /api/admin/heatmap, though those endpoints exist too).
// ---------------------------------------------------------------------------
export function getAdminStats() {
  const reports = state.reports;
  return {
    active: reports.filter((r) => r.status !== "resolved").length,
    pending: reports.filter((r) => r.status === "pending").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    highPriority: reports.filter((r) => r.severity === "HIGH" && r.status !== "resolved").length,
  };
}

export function getHeatmapData() {
  const counts = {};
  state.reports.forEach((r) => { counts[r.locationId] = (counts[r.locationId] || 0) + 1; });
  return state.locations.map((l) => ({ ...l, reportCount: counts[l.id] || 0 }));
}

// ---------------------------------------------------------------------------
// Admin auth — real JWT login against POST /api/admin/login. The token is
// kept in memory + localStorage (session only, not app data) so a signed-in
// admin stays signed in across a page refresh.
// ---------------------------------------------------------------------------
export function isAdminLoggedIn() { return !!state.adminToken; }
export function getAdminName() { return state.adminName; }
export function getAdminEmail() { return state.adminEmail; }

export async function adminLogin(email, password) {
  const data = await fetchJSON("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  state.adminToken = data.token;
  state.adminName = data.name;
  state.adminEmail = data.email;
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(data));
  } catch { /* storage unavailable — session just won't survive a refresh */ }
  emit();
  return data;
}

export function adminLogout() {
  state.adminToken = null;
  state.adminName = null;
  state.adminEmail = null;
  try { localStorage.removeItem(ADMIN_SESSION_KEY); } catch { /* ignore */ }
  emit();
}

export async function adminSetStatus(reportId, status) {
  try {
    const report = await fetchJSON(`/admin/reports/${encodeURIComponent(reportId)}/status`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    await loadBootstrap();
    return report;
  } catch (e) {
    if (e.status === 401) adminLogout();
    throw e;
  }
}

export async function resetDemoData() {
  try {
    await fetchJSON("/admin/reset", { method: "POST", headers: authHeaders() });
    await loadBootstrap();
  } catch (e) {
    if (e.status === 401) adminLogout();
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Regular-user auth — separate from admin auth above. Real JWT login/register
// against POST /api/auth/login and /api/auth/register. Token kept in memory +
// localStorage (session only) so a signed-in user stays signed in on refresh.
// ---------------------------------------------------------------------------
export function isUserLoggedIn() { return !!state.userToken; }
export function getUserName() { return state.userName; }
export function getUserEmail() { return state.userEmail; }
export function userAuthHeader() { return userAuthHeaders(); }

export async function userRegister(name, email, password) {
  const data = await fetchJSON("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  state.userToken = data.token;
  state.userName = data.name;
  state.userEmail = data.email;
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(data));
  } catch { /* storage unavailable — session just won't survive a refresh */ }
  emit();
  return data;
}

export async function userLogin(email, password) {
  const data = await fetchJSON("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  state.userToken = data.token;
  state.userName = data.name;
  state.userEmail = data.email;
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(data));
  } catch { /* storage unavailable — session just won't survive a refresh */ }
  emit();
  return data;
}

export function userLogout() {
  state.userToken = null;
  state.userName = null;
  state.userEmail = null;
  try { localStorage.removeItem(USER_SESSION_KEY); } catch { /* ignore */ }
  emit();
}

// ---------------------------------------------------------------------------
// Community points / profile / leaderboard — all read from the backend live
// (not cached in `state` like bootstrap data) since they're viewed on their
// own pages rather than needed on every render.
// ---------------------------------------------------------------------------
export function getMyProfile() {
  return fetchJSON("/users/me", { headers: userAuthHeaders() });
}

export function getMyPointHistory(limit = 20, offset = 0) {
  return fetchJSON(`/users/me/history?limit=${limit}&offset=${offset}`, { headers: userAuthHeaders() });
}

export function getLeaderboard(limit = 10) {
  return fetchJSON(`/leaderboard?limit=${limit}`, { headers: userAuthHeaders() });
}
