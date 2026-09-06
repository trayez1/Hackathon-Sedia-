import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyProfile, getMyPointHistory, getUserName } from "../services/store.js";
import LevelBar from "../components/LevelBar.jsx";
import { timeAgo } from "../utils/time.js";

function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch((e) => { if (!cancelled) setError(e.message || "Could not load your profile."); });
    return () => { cancelled = true; };
  }, []);

  async function loadFullHistory() {
    setLoadingMore(true);
    try {
      const data = await getMyPointHistory(50, 0);
      setHistory(data.items);
    } catch {
      /* leave the recent-activity slice showing */
    } finally {
      setLoadingMore(false);
    }
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-2xl bg-white ring-1 ring-red-200 p-6 text-center">
          <p className="font-semibold text-ink-900">Couldn't load your profile</p>
          <p className="text-sm text-ink-900/60 mt-1.5">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-ink-900/50">Loading profile…</p>
      </div>
    );
  }

  const activity = history || profile.recentActivity;

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">
      <section className="rounded-2xl bg-white ring-1 ring-ink-900/10 p-6 sm:p-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-brand-600 text-white flex items-center justify-center text-2xl font-bold">
          {initials(profile.name || getUserName())}
        </div>
        <h1 className="mt-3 text-xl font-bold text-ink-900">{profile.name}</h1>
        <p className="text-sm text-ink-900/50">{profile.email}</p>

        <div className="mt-5 max-w-xs mx-auto">
          <LevelBar level={profile.level} />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <Stat label="Reports" value={profile.stats.reportsCount} />
          <Stat label="Confirmations" value={profile.stats.confirmedCount} />
          <Stat label="Helpful Contributions" value={profile.stats.helpfulCount} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink-900/70">Recent activity</h2>
          <Link to="/leaderboard" className="focus-ring text-xs font-semibold text-brand-600 hover:underline">
            View leaderboard →
          </Link>
        </div>

        {activity.length === 0 ? (
          <p className="text-sm text-ink-900/50 rounded-xl bg-white ring-1 ring-ink-900/10 p-4">
            No activity yet — report an obstacle or confirm one to start earning points.
          </p>
        ) : (
          <ul className="space-y-2">
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white ring-1 ring-ink-900/10 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900">{a.reasonLabel}</p>
                  <p className="text-xs text-ink-900/45">{timeAgo(a.createdAt)}</p>
                </div>
                <span className={`text-sm font-bold ${a.amount >= 0 ? "text-brand-600" : "text-red-600"}`}>
                  {a.amount >= 0 ? "+" : ""}{a.amount}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!history && profile.recentActivity.length >= 10 && (
          <button
            onClick={loadFullHistory}
            disabled={loadingMore}
            className="focus-ring mt-3 rounded-lg bg-white ring-1 ring-ink-900/15 px-4 py-2 text-xs font-semibold hover:bg-ink-900/5 disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Show full history"}
          </button>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-ink-900/[0.03] py-3">
      <p className="text-lg font-bold text-ink-900">{value}</p>
      <p className="text-[11px] text-ink-900/50 mt-0.5">{label}</p>
    </div>
  );
}
