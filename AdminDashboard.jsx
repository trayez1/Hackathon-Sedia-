import { useStoreVersion } from "../../services/useStore.js";
import { getReports, getAdminStats, getHeatmapData, getAdminName } from "../../services/store.js";
import { StatBox, ReportTableRow } from "./AdminUI.jsx";

export default function AdminDashboard({ onSignOut }) {
  useStoreVersion();
  const stats = getAdminStats();
  const adminName = getAdminName();
  const reports = getReports();
  const heat = getHeatmapData().filter((h) => h.reportCount > 0).sort((a, b) => b.reportCount - a.reportCount);
  const maxCount = Math.max(1, ...heat.map((h) => h.reportCount));

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Accessibility Admin Dashboard</h1>
          <p className="text-sm text-ink-900/60">Signed in as {adminName}</p>
        </div>
        <button onClick={onSignOut} className="focus-ring rounded-lg ring-1 ring-ink-900/15 px-4 py-2 text-sm font-medium hover:bg-ink-900/5">
          Sign out
        </button>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <StatBox label="Active Reports" value={stats.active} tone="brand" />
        <StatBox label="Pending Verification" value={stats.pending} tone="amber" />
        <StatBox label="Resolved Issues" value={stats.resolved} tone="ink" />
        <StatBox label="High Priority" value={stats.highPriority} tone="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink-900/70 mb-3">Reports</h2>
          <div className="rounded-2xl ring-1 ring-ink-900/10 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-900/5 text-left text-xs uppercase tracking-wide text-ink-900/50">
                <tr>
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <ReportTableRow key={r.id} report={r} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink-900/70 mb-3">Accessibility heatmap</h2>
          <p className="text-xs text-ink-900/50 mb-3">
            Locations ranked by number of accessibility reports — helps prioritize infrastructure repairs.
          </p>
          <div className="rounded-2xl ring-1 ring-ink-900/10 bg-white p-4 space-y-3">
            {heat.length === 0 && <p className="text-sm text-ink-900/40">No reports yet.</p>}
            {heat.map((h) => (
              <div key={h.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink-900/80">{h.name}</span>
                  <span className="text-ink-900/50 text-xs">{h.reportCount} report{h.reportCount === 1 ? "" : "s"}</span>
                </div>
                <div className="h-2 rounded-full bg-ink-900/5 overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${(h.reportCount / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
