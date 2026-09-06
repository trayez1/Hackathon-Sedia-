// ============================================================================
// okayUway — MMU Cyberjaya Pilot Dataset
// This file represents "Demo Data" standing in for a real PostgreSQL/Supabase
// database. Shapes mirror the schema documented in the README so this can be
// swapped for real API calls with minimal changes to the rest of the app.
// ============================================================================

// Campus map is a stylized SVG plan, not a real geodetic survey.
// viewBox: 0 0 1000 640
export const CAMPUS_VIEWBOX = "0 0 1000 640";

export const LOCATIONS = [
  {
    id: "loc-library",
    name: "MMU Library",
    type: "Academic / Library",
    x: 300, y: 260,
    description: "Main library building, 4 floors.",
  },
  {
    id: "loc-fci",
    name: "Faculty of Computing & Informatics (FCI)",
    type: "Faculty",
    x: 470, y: 190,
  },
  {
    id: "loc-foe",
    name: "Faculty of Engineering (FOE)",
    type: "Faculty",
    x: 620, y: 150,
  },
  {
    id: "loc-fom",
    name: "Faculty of Management (FOM)",
    type: "Faculty",
    x: 560, y: 300,
  },
  {
    id: "loc-fca",
    name: "Faculty of Cinematic Arts (FCA)",
    type: "Faculty",
    x: 700, y: 320,
  },
  {
    id: "loc-dtc",
    name: "Dewan Tun Canselor (DTC / Main Auditorium)",
    type: "Auditorium",
    x: 420, y: 380,
  },
  {
    id: "loc-admin",
    name: "Chancery (Administration Building)",
    type: "Administration",
    x: 300, y: 420,
    landmark: true,
  },
  {
    id: "loc-cafeteria",
    name: "Cyber Café (Main Cafeteria)",
    type: "Food & Beverage",
    x: 400, y: 470,
  },
  {
    id: "loc-studentcentre",
    name: "Student Centre",
    type: "Student Services",
    x: 250, y: 480,
  },
  {
    id: "loc-sports",
    name: "Sports Complex & Multipurpose Hall",
    type: "Sports",
    x: 780, y: 480,
  },
  {
    id: "loc-hostel",
    name: "Residential College (Hostel Block C)",
    type: "Residential",
    x: 850, y: 220,
  },
  {
    id: "loc-clinic",
    name: "Health & Wellness Centre",
    type: "Health",
    x: 200, y: 350,
  },
  {
    id: "loc-parking",
    name: "Covered Parking (near FCI)",
    type: "Parking",
    x: 480, y: 90,
  },
  {
    id: "loc-gate",
    name: "Main Entrance Gate",
    type: "Entrance",
    x: 130, y: 500,
    landmark: true,
  },
  {
    id: "loc-bestari",
    name: "BestariCom Lecture Hall Block",
    type: "Academic",
    x: 640, y: 420,
  },
];

export const LOCATIONS_BY_ID = Object.fromEntries(LOCATIONS.map(l => [l.id, l]));

// Pedestrian paths (edges) drawn on the map, purely visual context.
export const PATHS = [
  ["loc-gate", "loc-studentcentre"],
  ["loc-studentcentre", "loc-admin"],
  ["loc-admin", "loc-library"],
  ["loc-admin", "loc-cafeteria"],
  ["loc-clinic", "loc-library"],
  ["loc-library", "loc-dtc"],
  ["loc-library", "loc-fci"],
  ["loc-fci", "loc-foe"],
  ["loc-fci", "loc-parking"],
  ["loc-fci", "loc-fom"],
  ["loc-fom", "loc-fca"],
  ["loc-fom", "loc-bestari"],
  ["loc-dtc", "loc-cafeteria"],
  ["loc-cafeteria", "loc-bestari"],
  ["loc-bestari", "loc-sports"],
  ["loc-fca", "loc-hostel"],
  ["loc-fca", "loc-sports"],
];

// ---------------------------------------------------------------------------
// AccessibilityFeatures — the atomic units routes are scored against.
// status values: "good" | "working" | "broken" | "blocked" | "damaged" | "steep"
// ---------------------------------------------------------------------------
export const INITIAL_FEATURES = [
  // Library
  { id: "feat-lib-ramp", locationId: "loc-library", type: "ramp", name: "Front ramp", status: "good", lastVerified: minutesAgo(32), confirmations: 12, disputes: 1, description: "Gentle 1:14 gradient ramp beside main stairs." },
  { id: "feat-lib-lift", locationId: "loc-library", type: "lift", name: "Main lift (Block A)", status: "working", lastVerified: minutesAgo(32), confirmations: 12, disputes: 1 },
  { id: "feat-lib-entrance", locationId: "loc-library", type: "entrance", name: "Accessible side entrance", status: "good", lastVerified: hoursAgo(3), confirmations: 8, disputes: 0 },
  { id: "feat-lib-stairs", locationId: "loc-library", type: "stairs", name: "Front stairs (alt. route)", status: "good", lastVerified: daysAgo(9), confirmations: 4, disputes: 0 },

  // FCI
  { id: "feat-fci-ramp", locationId: "loc-fci", type: "ramp", name: "East wing ramp", status: "good", lastVerified: hoursAgo(1), confirmations: 15, disputes: 0 },
  { id: "feat-fci-lift", locationId: "loc-fci", type: "lift", name: "Atrium lift", status: "working", lastVerified: hoursAgo(1), confirmations: 15, disputes: 0 },
  { id: "feat-fci-entrance", locationId: "loc-fci", type: "entrance", name: "Main glass entrance", status: "good", lastVerified: hoursAgo(1), confirmations: 15, disputes: 0 },
  { id: "feat-fci-pavement", locationId: "loc-fci", type: "pavement", name: "Walkway to FCI", status: "good", lastVerified: daysAgo(2), confirmations: 6, disputes: 0 },

  // FOE
  { id: "feat-foe-ramp", locationId: "loc-foe", type: "ramp", name: "Loading-bay ramp", status: "blocked", lastVerified: minutesAgo(18), confirmations: 2, disputes: 1, description: "Frequently used for deliveries; can be temporarily obstructed." },
  { id: "feat-foe-lift", locationId: "loc-foe", type: "lift", name: "Workshop wing lift", status: "broken", lastVerified: hoursAgo(6), confirmations: 9, disputes: 0, description: "Under maintenance — parts on order." },
  { id: "feat-foe-entrance", locationId: "loc-foe", type: "entrance", name: "Main entrance (stairs only)", status: "damaged", lastVerified: daysAgo(17), confirmations: 3, disputes: 0 },
  { id: "feat-foe-stairs", locationId: "loc-foe", type: "stairs", name: "Front steps (12 steps)", status: "good", lastVerified: daysAgo(17), confirmations: 3, disputes: 0 },

  // FOM
  { id: "feat-fom-ramp", locationId: "loc-fom", type: "ramp", name: "Courtyard ramp", status: "good", lastVerified: hoursAgo(4), confirmations: 10, disputes: 0 },
  { id: "feat-fom-lift", locationId: "loc-fom", type: "lift", name: "Lobby lift", status: "working", lastVerified: hoursAgo(4), confirmations: 10, disputes: 0 },
  { id: "feat-fom-entrance", locationId: "loc-fom", type: "entrance", name: "Accessible front entrance", status: "good", lastVerified: hoursAgo(4), confirmations: 10, disputes: 0 },

  // FCA
  { id: "feat-fca-ramp", locationId: "loc-fca", type: "ramp", name: "Studio-side ramp", status: "steep", lastVerified: daysAgo(5), confirmations: 5, disputes: 2, description: "Gradient steeper than recommended (approx. 1:8)." },
  { id: "feat-fca-lift", locationId: "loc-fca", type: "lift", name: "Production block lift", status: "working", lastVerified: daysAgo(1), confirmations: 7, disputes: 0 },
  { id: "feat-fca-entrance", locationId: "loc-fca", type: "entrance", name: "Rear accessible entrance", status: "good", lastVerified: daysAgo(1), confirmations: 7, disputes: 0 },

  // DTC
  { id: "feat-dtc-ramp", locationId: "loc-dtc", type: "ramp", name: "Grand hall ramp", status: "good", lastVerified: hoursAgo(2), confirmations: 20, disputes: 0 },
  { id: "feat-dtc-entrance", locationId: "loc-dtc", type: "entrance", name: "Accessible main doors", status: "good", lastVerified: hoursAgo(2), confirmations: 20, disputes: 0 },

  // Admin / Chancery
  { id: "feat-admin-ramp", locationId: "loc-admin", type: "ramp", name: "Chancery ramp", status: "good", lastVerified: daysAgo(1), confirmations: 6, disputes: 0 },
  { id: "feat-admin-lift", locationId: "loc-admin", type: "lift", name: "Chancery lift", status: "working", lastVerified: daysAgo(1), confirmations: 6, disputes: 0 },
  { id: "feat-admin-entrance", locationId: "loc-admin", type: "entrance", name: "Main accessible entrance", status: "good", lastVerified: daysAgo(1), confirmations: 6, disputes: 0 },

  // Cafeteria
  { id: "feat-cafe-pavement", locationId: "loc-cafeteria", type: "pavement", name: "Outdoor seating pavement", status: "damaged", lastVerified: daysAgo(4), confirmations: 5, disputes: 1, description: "Cracked tiles near the drinks stalls." },
  { id: "feat-cafe-entrance", locationId: "loc-cafeteria", type: "entrance", name: "Step-free entrance", status: "good", lastVerified: daysAgo(4), confirmations: 5, disputes: 1 },

  // Student Centre
  { id: "feat-sc-ramp", locationId: "loc-studentcentre", type: "ramp", name: "Front ramp", status: "good", lastVerified: hoursAgo(5), confirmations: 9, disputes: 0 },
  { id: "feat-sc-entrance", locationId: "loc-studentcentre", type: "entrance", name: "Automatic doors", status: "good", lastVerified: hoursAgo(5), confirmations: 9, disputes: 0 },

  // Sports Complex
  { id: "feat-sports-ramp", locationId: "loc-sports", type: "ramp", name: "Hall access ramp", status: "good", lastVerified: daysAgo(2), confirmations: 4, disputes: 0 },
  { id: "feat-sports-entrance", locationId: "loc-sports", type: "entrance", name: "Side accessible entrance", status: "good", lastVerified: daysAgo(2), confirmations: 4, disputes: 0 },

  // Hostel
  { id: "feat-hostel-ramp", locationId: "loc-hostel", type: "ramp", name: "Block C ramp", status: "good", lastVerified: daysAgo(6), confirmations: 3, disputes: 0 },
  { id: "feat-hostel-lift", locationId: "loc-hostel", type: "lift", name: "Block C lift", status: "working", lastVerified: daysAgo(6), confirmations: 3, disputes: 0 },

  // Clinic
  { id: "feat-clinic-ramp", locationId: "loc-clinic", type: "ramp", name: "Clinic ramp", status: "good", lastVerified: hoursAgo(8), confirmations: 5, disputes: 0 },
  { id: "feat-clinic-entrance", locationId: "loc-clinic", type: "entrance", name: "Ground-floor accessible entrance", status: "good", lastVerified: hoursAgo(8), confirmations: 5, disputes: 0 },

  // Parking
  { id: "feat-parking-bay", locationId: "loc-parking", type: "parking", name: "OKU parking bays (x4)", status: "good", lastVerified: daysAgo(3), confirmations: 6, disputes: 0 },
  { id: "feat-parking-pavement", locationId: "loc-parking", type: "pavement", name: "Walkway to FCI", status: "good", lastVerified: daysAgo(3), confirmations: 6, disputes: 0 },

  // BestariCom
  { id: "feat-bestari-ramp", locationId: "loc-bestari", type: "ramp", name: "Lecture block ramp", status: "good", lastVerified: hoursAgo(6), confirmations: 8, disputes: 0 },
  { id: "feat-bestari-entrance", locationId: "loc-bestari", type: "entrance", name: "Accessible entrance", status: "good", lastVerified: hoursAgo(6), confirmations: 8, disputes: 0 },
];

// ---------------------------------------------------------------------------
// Route templates: for each destination, a "fastest" and "accessible" path
// FROM the Main Entrance Gate (default starting point for the demo).
// Each checkpoint references a feature id so scores stay LIVE as feature
// status changes via reports/verification (see services/store.js).
// ---------------------------------------------------------------------------
export const ROUTE_TEMPLATES = {
  "loc-library": {
    fastest: { distance: 210, duration: 3, path: ["loc-gate", "loc-studentcentre", "loc-library"], checkpoints: ["feat-lib-stairs"], notes: ["Shortcut through the old stairwell — no ramp."] },
    accessible: { distance: 340, duration: 5, path: ["loc-gate", "loc-studentcentre", "loc-admin", "loc-library"], checkpoints: ["feat-sc-ramp", "feat-admin-ramp", "feat-lib-ramp", "feat-lib-lift", "feat-lib-entrance"] },
  },
  "loc-foe": {
    fastest: { distance: 400, duration: 5, path: ["loc-gate", "loc-library", "loc-fci", "loc-foe"], checkpoints: ["feat-foe-stairs", "feat-foe-lift", "feat-foe-entrance"], notes: ["Direct path — front entrance has stairs only."] },
    accessible: { distance: 650, duration: 8, path: ["loc-gate", "loc-library", "loc-fci", "loc-parking", "loc-foe"], checkpoints: ["feat-lib-ramp", "feat-fci-ramp", "feat-fci-lift", "feat-foe-ramp"] },
  },
  "loc-fci": {
    fastest: { distance: 260, duration: 4, path: ["loc-gate", "loc-library", "loc-fci"], checkpoints: ["feat-fci-entrance", "feat-fci-ramp"] },
    accessible: { distance: 260, duration: 4, path: ["loc-gate", "loc-library", "loc-fci"], checkpoints: ["feat-lib-ramp", "feat-fci-ramp", "feat-fci-lift", "feat-fci-entrance"] },
  },
  "loc-fom": {
    fastest: { distance: 330, duration: 4, path: ["loc-gate", "loc-library", "loc-fci", "loc-fom"], checkpoints: ["feat-fom-entrance"] },
    accessible: { distance: 380, duration: 5, path: ["loc-gate", "loc-library", "loc-fci", "loc-fom"], checkpoints: ["feat-fci-ramp", "feat-fom-ramp", "feat-fom-lift", "feat-fom-entrance"] },
  },
  "loc-fca": {
    fastest: { distance: 480, duration: 6, path: ["loc-gate", "loc-dtc", "loc-fom", "loc-fca"], checkpoints: ["feat-fca-ramp"], notes: ["Uses the steep studio-side ramp."] },
    accessible: { distance: 560, duration: 8, path: ["loc-gate", "loc-studentcentre", "loc-admin", "loc-cafeteria", "loc-bestari", "loc-fom", "loc-fca"], checkpoints: ["feat-admin-ramp", "feat-fom-ramp", "feat-fca-lift", "feat-fca-entrance"] },
  },
  "loc-dtc": {
    fastest: { distance: 260, duration: 4, path: ["loc-gate", "loc-studentcentre", "loc-admin", "loc-library", "loc-dtc"], checkpoints: ["feat-dtc-ramp", "feat-dtc-entrance"] },
    accessible: { distance: 260, duration: 4, path: ["loc-gate", "loc-studentcentre", "loc-admin", "loc-library", "loc-dtc"], checkpoints: ["feat-dtc-ramp", "feat-dtc-entrance"] },
  },
  "loc-admin": {
    fastest: { distance: 190, duration: 3, path: ["loc-gate", "loc-studentcentre", "loc-admin"], checkpoints: ["feat-admin-entrance"] },
    accessible: { distance: 190, duration: 3, path: ["loc-gate", "loc-studentcentre", "loc-admin"], checkpoints: ["feat-admin-ramp", "feat-admin-lift", "feat-admin-entrance"] },
  },
  "loc-cafeteria": {
    fastest: { distance: 300, duration: 4, path: ["loc-gate", "loc-admin", "loc-cafeteria"], checkpoints: ["feat-cafe-pavement", "feat-cafe-entrance"] },
    accessible: { distance: 320, duration: 5, path: ["loc-gate", "loc-studentcentre", "loc-admin", "loc-cafeteria"], checkpoints: ["feat-admin-ramp", "feat-cafe-entrance"] },
  },
  "loc-studentcentre": {
    fastest: { distance: 120, duration: 2, path: ["loc-gate", "loc-studentcentre"], checkpoints: ["feat-sc-entrance"] },
    accessible: { distance: 120, duration: 2, path: ["loc-gate", "loc-studentcentre"], checkpoints: ["feat-sc-ramp", "feat-sc-entrance"] },
  },
  "loc-sports": {
    fastest: { distance: 620, duration: 8, path: ["loc-gate", "loc-dtc", "loc-cafeteria", "loc-bestari", "loc-sports"], checkpoints: ["feat-sports-entrance"] },
    accessible: { distance: 700, duration: 9, path: ["loc-gate", "loc-studentcentre", "loc-admin", "loc-cafeteria", "loc-bestari", "loc-sports"], checkpoints: ["feat-admin-ramp", "feat-bestari-ramp", "feat-sports-ramp", "feat-sports-entrance"] },
  },
  "loc-hostel": {
    fastest: { distance: 760, duration: 10, path: ["loc-gate", "loc-dtc", "loc-fom", "loc-fca", "loc-hostel"], checkpoints: ["feat-hostel-ramp"] },
    accessible: { distance: 820, duration: 11, path: ["loc-gate", "loc-studentcentre", "loc-admin", "loc-cafeteria", "loc-bestari", "loc-fom", "loc-fca", "loc-hostel"], checkpoints: ["feat-fom-ramp", "feat-fca-lift", "feat-hostel-ramp", "feat-hostel-lift"] },
  },
  "loc-clinic": {
    fastest: { distance: 260, duration: 4, path: ["loc-gate", "loc-studentcentre", "loc-clinic"], checkpoints: ["feat-clinic-entrance"] },
    accessible: { distance: 260, duration: 4, path: ["loc-gate", "loc-studentcentre", "loc-clinic"], checkpoints: ["feat-clinic-ramp", "feat-clinic-entrance"] },
  },
  "loc-parking": {
    fastest: { distance: 300, duration: 4, path: ["loc-gate", "loc-library", "loc-fci", "loc-parking"], checkpoints: ["feat-parking-pavement"] },
    accessible: { distance: 300, duration: 4, path: ["loc-gate", "loc-library", "loc-fci", "loc-parking"], checkpoints: ["feat-fci-ramp", "feat-parking-bay", "feat-parking-pavement"] },
  },
  "loc-bestari": {
    fastest: { distance: 420, duration: 5, path: ["loc-gate", "loc-dtc", "loc-cafeteria", "loc-bestari"], checkpoints: ["feat-bestari-entrance"] },
    accessible: { distance: 420, duration: 5, path: ["loc-gate", "loc-studentcentre", "loc-admin", "loc-cafeteria", "loc-bestari"], checkpoints: ["feat-admin-ramp", "feat-bestari-ramp", "feat-bestari-entrance"] },
  },
};

// Pre-seeded community reports so the admin dashboard and map aren't empty on first load.
export const INITIAL_REPORTS = [
  {
    id: "rep-seed-1",
    locationId: "loc-foe",
    featureId: "feat-foe-lift",
    type: "Broken lift",
    description: "Workshop wing lift out of service since Tuesday.",
    photoDataUrl: null,
    severity: "HIGH",
    status: "verified",
    createdAt: hoursAgo(6),
    confirmations: 9,
    disputes: 0,
    aiAnalysis: null,
  },
  {
    id: "rep-seed-2",
    locationId: "loc-foe",
    featureId: "feat-foe-ramp",
    type: "Blocked ramp",
    description: "Delivery motorcycles parked across the loading-bay ramp.",
    photoDataUrl: null,
    severity: "HIGH",
    status: "pending",
    createdAt: minutesAgo(18),
    confirmations: 2,
    disputes: 1,
    aiAnalysis: { rampDetected: true, obstructionDetected: true, object: "Motorcycle", impact: "HIGH" },
  },
  {
    id: "rep-seed-3",
    locationId: "loc-cafeteria",
    featureId: "feat-cafe-pavement",
    type: "Damaged pavement",
    description: "Cracked tiles near the drinks stalls, wheels get stuck.",
    photoDataUrl: null,
    severity: "MEDIUM",
    status: "reviewing",
    createdAt: hoursAgo(4),
    confirmations: 5,
    disputes: 1,
    aiAnalysis: null,
  },
  {
    id: "rep-seed-4",
    locationId: "loc-fca",
    featureId: "feat-fca-ramp",
    type: "Steep slope",
    description: "Studio-side ramp gradient feels unsafe without assistance.",
    photoDataUrl: null,
    severity: "MEDIUM",
    status: "verified",
    createdAt: daysAgo(5),
    confirmations: 5,
    disputes: 2,
    aiAnalysis: null,
  },
];

export function minutesAgo(n) { return new Date(Date.now() - n * 60 * 1000).toISOString(); }
export function hoursAgo(n) { return new Date(Date.now() - n * 60 * 60 * 1000).toISOString(); }
export function daysAgo(n) { return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString(); }
