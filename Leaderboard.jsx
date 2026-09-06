import { useEffect, useState } from "react";
import { getLeaderboard, isUserLoggedIn } from "../services/store.js";

function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getLeaderboard(10)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message || "Could not load the leaderboard."); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-ink-900">Community leaderboard</h1>
      <p className="text-sm text-ink-900/60 mt-1 mb-6">
        Top contributors helping keep okayUway's accessibility data accurate and up to date.
      </p>

      {error && (
        <p className="text-sm text-red-600 rounded-xl bg-red-50 ring-1 ring-red-200 p-4">{error}</p>
      )}

      {!error && !data && <p className="text-sm text-ink-900/50">Loading…</p>}

      {data && (
        <>
          <ol className="space-y-2">
            {data.top.map((row) => (
              <LeaderboardRow key={row.id} row={row} highlight={data.me && data.me.id === row.id} />
            ))}
          </ol>

          {data.me && !data.top.some((r) => r.id === data.me.id) && (
            <>
              <p className="text-xs font-semibold text-ink-900/50 mt-6 mb-2">Your position</p>
              <ol>
                <LeaderboardRow row={data.me} highlight />
              </ol>
            </>
          )}

          {!data.me && !isUserLoggedIn() && (
            <p className="text-xs text-ink-900/45 mt-6">
              Log in to see your own rank on this leaderboard.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function LeaderboardRow({ row, highlight }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${
        highlight ? "bg-brand-50 ring-brand-200" : "bg-white ring-ink-900/10"
      }`}
    >
      <span className="w-6 text-sm font-bold text-ink-900/50 text-center">{row.rank}</span>
      <span className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
        {initials(row.name)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-900 truncate">{row.name}</p>
        <p className="text-xs text-ink-900/50">{row.level}</p>
      </div>
      <span className="text-sm font-bold text-brand-700 shrink-0">{row.points} pts</span>
    </li>
  );
}
