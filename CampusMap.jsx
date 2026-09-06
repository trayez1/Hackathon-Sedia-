import { useMemo, useState } from "react";
import { CAMPUS_VIEWBOX, LOCATIONS_BY_ID, PATHS } from "../data/seed.js";
import { getHeatmapData } from "../services/store.js";

const TYPE_ICON = {
  "Entrance": "🚪", "Academic / Library": "📚", "Faculty": "🏛",
  "Auditorium": "🎭", "Administration": "🏢", "Food & Beverage": "🍽",
  "Student Services": "🧑‍🤝‍🧑", "Sports": "🏟", "Residential": "🏠",
  "Health": "⚕", "Parking": "🅿", "Academic": "🏫",
};

const BUILDING_SIZE = {
  "Academic / Library": [100, 58], Faculty: [92, 54], Auditorium: [105, 58],
  Administration: [88, 52], "Food & Beverage": [92, 50], "Student Services": [90, 50],
  Sports: [112, 62], Residential: [100, 58], Health: [82, 48],
  Parking: [110, 46], Academic: [96, 54], Entrance: [70, 42],
};

export default function CampusMap({
  locations,
  selectedId,
  onSelect,
  routePath,
  obstacleLocationIds = [],
  showHeatmap = false,
  originId = "loc-gate",
}) {
  const [zoom, setZoom] = useState(1);
  const heat = useMemo(() => (showHeatmap ? getHeatmapData() : []), [showHeatmap]);
  const heatById = useMemo(() => Object.fromEntries(heat.map((h) => [h.id, h.reportCount])), [heat]);

  const routeLocs = routePath ? routePath.map((id) => LOCATIONS_BY_ID[id]).filter(Boolean) : null;
  const routeD = routeLocs && routeLocs.length > 1
    ? "M " + routeLocs.map((l) => `${l.x} ${l.y}`).join(" L ")
    : null;

  const transform = `translate(${500 - 500 * zoom} ${320 - 320 * zoom}) scale(${zoom})`;

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={CAMPUS_VIEWBOX}
        className="w-full h-full"
        role="img"
        aria-label="Interactive map of Multimedia University Cyberjaya campus"
      >
        <rect x="0" y="0" width="1000" height="640" fill="#f4f8f5" />
        <g transform={transform}>
          {/* Campus landscape */}
          <rect x="24" y="24" width="952" height="592" rx="28" fill="#edf5ef" stroke="#d7e4dc" strokeWidth="2" />
          <path d="M 35 540 C 230 470 250 585 440 510 S 760 470 965 550" fill="none" stroke="#dcebe1" strokeWidth="34" strokeLinecap="round" />
          <path d="M 90 110 C 300 165 420 75 600 115 S 800 170 940 90" fill="none" stroke="#dcebe1" strokeWidth="26" strokeLinecap="round" />

          {/* Trees / green pockets */}
          {[ [110,150,58], [900,560,72], [910,120,54], [150,570,46], [720,560,42] ].map(([cx,cy,r], i) => (
            <g key={i} opacity="0.75">
              <circle cx={cx} cy={cy} r={r} fill="#dcecdf" />
              <circle cx={cx-12} cy={cy+8} r={r*0.52} fill="#cfe4d4" />
            </g>
          ))}

          {/* pedestrian paths */}
          {PATHS.map(([a, b], i) => {
            const la = LOCATIONS_BY_ID[a], lb = LOCATIONS_BY_ID[b];
            if (!la || !lb) return null;
            return (
              <line key={i} x1={la.x} y1={la.y} x2={lb.x} y2={lb.y}
                stroke="#ffffff" strokeWidth="14" strokeLinecap="round" opacity="0.95" />
            );
          })}
          {PATHS.map(([a, b], i) => {
            const la = LOCATIONS_BY_ID[a], lb = LOCATIONS_BY_ID[b];
            if (!la || !lb) return null;
            return (
              <line key={`inner-${i}`} x1={la.x} y1={la.y} x2={lb.x} y2={lb.y}
                stroke="#b9ccc1" strokeWidth="3" strokeDasharray="5 7" strokeLinecap="round" />
            );
          })}

          {/* heatmap overlay */}
          {showHeatmap && heat.map((h) => {
            const count = heatById[h.id] || 0;
            if (!count) return null;
            const r = 22 + Math.min(count, 5) * 10;
            const opacity = Math.min(0.12 + count * 0.08, 0.55);
            return <circle key={h.id} cx={h.x} cy={h.y} r={r} fill="#dc2626" opacity={opacity} />;
          })}

          {/* active route */}
          {routeD && (
            <path d={routeD} fill="none" stroke="#106b4b" strokeWidth="9"
              strokeDasharray="2 12" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" from="28" to="0" dur="1s" repeatCount="indefinite" />
            </path>
          )}

          {/* building footprints + markers */}
          {locations.map((loc) => {
            const isSelected = loc.id === selectedId;
            const isOrigin = loc.id === originId;
            const hasObstacle = obstacleLocationIds.includes(loc.id);
            const icon = isOrigin ? "📍" : (TYPE_ICON[loc.type] || "📌");
            const [w, h] = BUILDING_SIZE[loc.type] || [86, 48];

            return (
              <g key={loc.id} className="cursor-pointer focus:outline-none" tabIndex={0}
                role="button"
                aria-label={`${loc.name}${hasObstacle ? ", has an active accessibility report" : ""}`}
                onClick={() => onSelect?.(loc)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect?.(loc); }}
              >
                {!isOrigin && (
                  <rect x={loc.x-w/2} y={loc.y-h/2} width={w} height={h} rx="12"
                    fill={isSelected ? "#d9f1e5" : "#ffffff"} stroke={isSelected ? "#106b4b" : "#c2d0c9"}
                    strokeWidth={isSelected ? "3" : "2"} />
                )}
                {isSelected && <circle cx={loc.x} cy={loc.y} r="33" fill="none" stroke="#106b4b" strokeWidth="2" className="pulse-ring" />}
                <circle cx={loc.x} cy={loc.y} r={isOrigin ? 17 : 16}
                  fill={isSelected ? "#106b4b" : "#ffffff"} stroke={isSelected ? "#0e4634" : "#94a89d"} strokeWidth="2" />
                <text x={loc.x} y={loc.y+5} textAnchor="middle" fontSize="14">{icon}</text>
                {hasObstacle && <circle cx={loc.x+13} cy={loc.y-13} r="7" fill="#dc2626" stroke="#fff" strokeWidth="2" />}
                <text x={loc.x} y={loc.y+h/2+18} textAnchor="middle" fontSize="11"
                  fontWeight={isSelected ? "700" : "500"} fill={isSelected ? "#0e4634" : "#334843"}
                  className="select-none">
                  {loc.name.length > 24 ? loc.name.slice(0, 22) + "…" : loc.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute right-4 top-4 flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-ink-900/10">
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))}
          className="focus-ring h-10 w-10 text-lg font-semibold hover:bg-brand-50">+</button>
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.15).toFixed(2)))}
          className="focus-ring h-10 w-10 border-t text-lg font-semibold hover:bg-brand-50">−</button>
        <button type="button" aria-label="Reset map zoom" onClick={() => setZoom(1)}
          className="focus-ring h-9 border-t text-[11px] font-semibold hover:bg-brand-50">Reset</button>
      </div>
      <div className="absolute right-4 bottom-4 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] text-ink-900/60 ring-1 ring-ink-900/10">
        Scroll/zoom controls • Select a building
      </div>
    </div>
  );
}
