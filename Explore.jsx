import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CampusMap from "../components/CampusMap.jsx";
import ScoreBar from "../components/ScoreBar.jsx";
import { FeatureBadge, FreshnessChip } from "../components/Badges.jsx";
import { useProfile, PROFILES } from "../context/ProfileContext.jsx";
import { useStoreVersion } from "../services/useStore.js";
import {
  getLocations, searchLocations, getRoutesForDestination, getReportsForLocation,
} from "../services/store.js";
import { timeAgo } from "../utils/time.js";

const ORIGIN_ID = "loc-gate";

export default function Explore() {
  useStoreVersion();
  const { profile, setProfile } = useProfile();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [activeRouteKey, setActiveRouteKey] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [originId, setOriginId] = useState(ORIGIN_ID);

  const allLocations = getLocations();
  const originLocation = allLocations.find((l) => l.id === originId) || allLocations.find((l) => l.id === ORIGIN_ID);
  const results = useMemo(() => searchLocations(query), [query, selected]);
  const outsidePilot = query.trim().length > 0 && results.length === 0;

  const routes = selected && selected.id !== originId ? getRoutesForDestination(selected.id, originId) : null;
  const routesLoading = !!routes?.loading;
  const routesReady = !!routes && !routesLoading;
  const activeRoute = routesReady ? (activeRouteKey ? routes[activeRouteKey] : routes[routes.recommend]) : null;
  const locationReports = selected ? getReportsForLocation(selected.id).filter(r => r.status !== "resolved") : [];
  const obstacleLocationIds = allLocations
    .filter(l => getReportsForLocation(l.id).some(r => r.status !== "resolved"))
    .map(l => l.id);

  function handleSelect(loc) {
    setSelected(loc);
    setActiveRouteKey(null);
    setDismissedWarning(false);
  }

  const routeHasActiveIssue = activeRoute && activeRoute.issues.some((i) => ["broken", "blocked"].includes(i.feature.status));

  return (
    <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
      {/* LEFT SIDEBAR */}
      <aside className="lg:w-[380px] w-full border-r border-ink-900/10 bg-white flex flex-col">
        <div className="p-4 border-b border-ink-900/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-ink-900/70">Accessibility profile</h2>
            <span className="text-[10px] rounded-full bg-brand-50 text-brand-700 px-2 py-1 font-semibold">Personalized</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => p.id !== "visual" && setProfile(p.id)}
                disabled={p.id === "visual"}
                aria-pressed={profile === p.id}
                title={p.description}
                className={`focus-ring rounded-xl px-2 py-3 text-center transition-colors ring-1 ${
                  profile === p.id
                    ? "bg-brand-600 text-white ring-brand-600"
                    : p.id === "visual"
                    ? "bg-ink-900/5 text-ink-900/30 ring-ink-900/10 cursor-not-allowed"
                    : "bg-white text-ink-900/70 ring-ink-900/15 hover:bg-ink-900/5"
                }`}
              >
                <div className="text-xl">{p.icon}</div>
                <div className="text-[11px] font-medium mt-1 leading-tight">{p.label}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-900/50 mt-2">
            {PROFILES.find((p) => p.id === profile)?.description}
          </p>
        </div>

        <div className="p-4 border-b border-ink-900/10">
          <label htmlFor="origin-select" className="text-sm font-semibold text-ink-900/70">Your location</label>
          <select
            id="origin-select"
            value={originId}
            onChange={(e) => { setOriginId(e.target.value); setActiveRouteKey(null); setDismissedWarning(false); }}
            className="focus-ring mt-2 w-full rounded-xl ring-1 ring-ink-900/15 px-3 py-2.5 text-sm bg-white"
          >
            {allLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}{loc.id === ORIGIN_ID ? " (default)" : ""}</option>
            ))}
          </select>
          <p className="text-[11px] text-ink-900/45 mt-1.5">Routes and directions are calculated starting from here.</p>
        </div>

        <div className="p-4 border-b border-ink-900/10">
          <label htmlFor="dest-search" className="text-sm font-semibold text-ink-900/70">Search destination</label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-900/40">⌕</span>
            <input
              id="dest-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) handleSelect(results[0]);
                if (e.key === "Escape") setQuery("");
              }}
              placeholder="Search library, FCI, cafeteria…"
              autoComplete="off"
              className="focus-ring w-full rounded-xl ring-1 ring-ink-900/15 pl-9 pr-10 py-2.5 text-sm"
              aria-describedby="search-help"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search"
                className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-ink-900/50 hover:bg-ink-900/5">×</button>
            )}
          </div>
          <p id="search-help" className="text-[11px] text-ink-900/45 mt-1.5">Search by building name, faculty, or common abbreviation. Press Enter to open the top result.</p>

          {outsidePilot && (
            <div className="mt-3 rounded-xl bg-amber-50 ring-1 ring-amber-200 p-3 text-sm text-amber-900">
              <p className="font-semibold">Outside pilot area</p>
              <p className="mt-1">okayUway is currently available only within the Multimedia University Cyberjaya pilot area.</p>
              <button
                onClick={() => setQuery("")}
                className="focus-ring mt-2 rounded-lg bg-white ring-1 ring-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100"
              >
                Return to MMU Map
              </button>
            </div>
          )}

          {!outsidePilot && query && (
            <ul className="mt-3 max-h-48 overflow-y-auto space-y-1" role="listbox" aria-label="Search results">
              <li className="px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-900/40">{results.length} result{results.length === 1 ? "" : "s"}</li>
              {results.map((loc) => (
                <li key={loc.id}>
                  <button
                    onClick={() => handleSelect(loc)}
                    className="focus-ring w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-brand-50 flex items-center justify-between"
                  >
                    <span>{loc.name}</span>
                    <span className="text-xs text-ink-900/40">{loc.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-ink-900/70">Campus locations</h2>
            <label className="flex items-center gap-1.5 text-xs text-ink-900/60 cursor-pointer">
              <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} className="focus-ring" />
              Problem heatmap
            </label>
          </div>
          <ul className="space-y-1">
            {allLocations.map((loc) => (
              <li key={loc.id}>
                <button
                  onClick={() => handleSelect(loc)}
                  className={`focus-ring w-full text-left rounded-lg px-3 py-2 text-sm flex items-center justify-between ${
                    selected?.id === loc.id ? "bg-brand-50 text-brand-800 font-medium" : "hover:bg-ink-900/5"
                  }`}
                >
                  <span>{loc.name}</span>
                  {obstacleLocationIds.includes(loc.id) && <span title="Active accessibility report" aria-hidden="true">🔴</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* MAP */}
      <div className="flex-1 min-h-[420px] bg-brand-50/40 relative">
        <CampusMap
          locations={allLocations}
          selectedId={selected?.id}
          onSelect={handleSelect}
          routePath={activeRoute?.path}
          obstacleLocationIds={obstacleLocationIds}
          showHeatmap={showHeatmap}
          originId={originId}
        />
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-xl ring-1 ring-ink-900/10 px-3 py-2 text-xs font-medium text-ink-900/70 shadow-sm">
          📍 Pilot Area: Multimedia University, Cyberjaya
        </div>
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl ring-1 ring-ink-900/10 px-3 py-2 text-xs text-ink-900/60 shadow-sm flex flex-wrap gap-x-3 gap-y-1 max-w-xs">
          <span>♿ Accessible</span><span>🔴 Obstacle</span><span>📍 You are here ({originLocation?.name})</span>
        </div>
      </div>

      {/* DETAIL PANEL */}
      <aside className="lg:w-[420px] w-full border-l border-ink-900/10 bg-white overflow-y-auto">
        {!selected && (
          <div className="p-6 text-sm text-ink-900/50">
            Select a destination on the map or from search to see accessibility scores and routes.
          </div>
        )}

        {selected && selected.id === originId && (
          <div className="p-6 text-sm text-ink-900/50">
            You're already at {selected.name}. Pick a different destination, or change "Your location" to plan a route.
          </div>
        )}

        {selected && selected.id !== originId && routesLoading && (
          <div className="p-6 text-sm text-ink-900/50 flex items-center gap-2">
            <span className="animate-pulse">♿</span> Calculating routes from {originLocation?.name}…
          </div>
        )}

        {selected && selected.id !== originId && !routesLoading && !routes && (
          <div className="p-6 text-sm text-ink-900/50">
            No route data is available from {originLocation?.name} to {selected.name} yet.
          </div>
        )}

        {selected && selected.id !== originId && routesReady && (
          <div className="p-5 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-brand-600">Destination</p>
              <h2 className="text-xl font-bold text-ink-900 mt-0.5">{selected.name}</h2>
              <p className="text-sm text-ink-900/50">{selected.type}</p>
            </div>

            <div className="rounded-2xl bg-brand-50/60 ring-1 ring-brand-100 p-4">
              <ScoreBar score={activeRoute.score} size="lg" />
              <p className="text-xs text-ink-900/50 mt-2">Based on available accessibility data and community reports. Not a certified or official rating.</p>
            </div>

            {locationReports.length > 0 && (
              <div className="space-y-2">
                {locationReports.map((r) => (
                  <div key={r.id} className="text-xs bg-red-50 ring-1 ring-red-200 rounded-lg px-3 py-2 text-red-800">
                    ⚠ {r.type} reported {timeAgo(r.createdAt)} — {r.status}
                  </div>
                ))}
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-ink-900/70 mb-2">Compare routes from {originLocation?.name}</h3>
              <div className="space-y-3">
                <RouteCard
                  route={routes.fastest}
                  isRecommended={routes.recommend === "fastest"}
                  isActive={activeRoute.key === "fastest"}
                  onSelect={() => setActiveRouteKey("fastest")}
                  title="Fastest route"
                />
                <RouteCard
                  route={routes.accessible}
                  isRecommended={routes.recommend === "accessible"}
                  isActive={activeRoute.key === "accessible"}
                  onSelect={() => setActiveRouteKey("accessible")}
                  title="Recommended accessible route"
                />
              </div>
              {routes.explanation && (
                <div className="mt-3 rounded-xl bg-brand-50/60 ring-1 ring-brand-100 p-3">
                  <p className="text-xs font-semibold text-brand-700 flex items-center gap-1">💡 Why we recommend this</p>
                  <p className="text-xs text-ink-900/70 mt-1 leading-relaxed">{routes.explanation}</p>
                </div>
              )}
            </div>

            {routeHasActiveIssue && !dismissedWarning && (
              <div className="rounded-2xl bg-red-50 ring-1 ring-red-200 p-4">
                <p className="font-semibold text-red-800 flex items-center gap-1.5">⚠ Accessibility warning</p>
                <p className="text-sm text-red-800/90 mt-1">
                  This route contains: {activeRoute.issues.filter(i => ["broken","blocked"].includes(i.feature.status)).map(i => i.feature.name).join(", ")}
                </p>
                <div className="mt-2 text-xs text-red-800/80">
                  {activeRoute.issues.slice(0,1).map(i => (
                    <span key={i.feature.id}>Reported {timeAgo(i.feature.lastVerified)} · Confidence {Math.round(100 - i.penalty)}%</span>
                  ))}
                </div>
                {routes.recommend !== activeRoute.key && (
                  <button
                    onClick={() => setActiveRouteKey(routes.recommend)}
                    className="focus-ring mt-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2"
                  >
                    Show alternative route
                  </button>
                )}
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-ink-900/70 mb-2">Accessibility features on selected route</h3>
              <div className="flex flex-wrap gap-2">
                {activeRoute.featureSnapshots.map((f) => <FeatureBadge key={f.id} feature={f} />)}
              </div>
              <div className="mt-3">
                <FreshnessChip iso={activeRoute.oldestVerification} />
              </div>
            </div>

            <Link
              to="/report"
              state={{ locationId: selected.id }}
              className="focus-ring block text-center rounded-xl bg-ink-900 hover:bg-ink-900/90 text-white font-semibold px-4 py-3 text-sm"
            >
              🚧 Report an obstacle here
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

function RouteCard({ route, isRecommended, isActive, onSelect, title }) {
  return (
    <button
      onClick={onSelect}
      className={`focus-ring w-full text-left rounded-2xl p-4 ring-2 transition-colors ${
        isActive ? "ring-brand-600 bg-brand-50/50" : "ring-ink-900/10 hover:ring-ink-900/25"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm text-ink-900">
          {title} {isRecommended && <span className="ml-1 text-brand-600">⭐ Recommended</span>}
        </span>
        <span className="text-xs text-ink-900/50">{route.distance}m · {route.duration} min</span>
      </div>
      <div className="mt-2">
        <ScoreBar score={route.score} label="Accessibility score" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {route.issues.slice(0, 3).map((i) => (
          <span key={i.feature.id} className="text-xs rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 px-2 py-0.5">
            ⚠ {i.feature.name}
          </span>
        ))}
        {route.goods.slice(0, 3).map((f) => (
          <span key={f.id} className="text-xs rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-200 px-2 py-0.5">
            ✓ {f.name}
          </span>
        ))}
      </div>
      {route.notes.map((n, i) => <p key={i} className="text-xs text-ink-900/50 mt-1.5">{n}</p>)}
    </button>
  );
}
