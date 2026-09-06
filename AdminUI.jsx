import { getLocationById, getConfidence, adminSetStatus, getPhotoUrl } from "../../services/store.js";
import { SeverityBadge, StatusPill } from "../../components/Badges.jsx";
import { timeAgo } from "../../utils/time.js";

export function StatBox({ label, value, tone }) {
  const toneMap = {
    brand: "text-brand-700 bg-brand-50",
    amber: "text-amber-700 bg-amber-50",
    red: "text-red-700 bg-red-50",
    ink: "text-ink-900 bg-ink-900/5",
  };
  return (
    <div className={`rounded-2xl ${toneMap[tone]} p-5`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-80">{label}</div>
    </div>
  );
}

export function ReportTableRow({ report }) {
  const loc = getLocationById(report.locationId);
  const confidence = getConfidence(report);
  return (
    <tr className="border-t border-ink-900/5">
      <td className="px-4 py-3">
        {report.photoDataUrl ? (
          <a href={getPhotoUrl(report.photoDataUrl)} target="_blank" rel="noopener noreferrer" className="focus-ring block" title="Open full-size photo evidence">
            <img
              src={getPhotoUrl(report.photoDataUrl)}
              alt={`Photo evidence for ${report.type} report`}
              className="w-14 h-14 object-cover rounded-lg ring-1 ring-ink-900/10"
            />
          </a>
        ) : (
          <span className="text-ink-900/30 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3 font-medium text-ink-900">{report.type}</td>
      <td className="px-4 py-3 text-ink-900/70">{loc?.name || "—"}</td>
      <td className="px-4 py-3"><SeverityBadge severity={report.severity} /></td>
      <td className="px-4 py-3 text-ink-900/70">{confidence}%</td>
      <td className="px-4 py-3"><StatusPill status={report.status} /></td>
      <td className="px-4 py-3 text-ink-900/50 text-xs">{timeAgo(report.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5 flex-wrap">
          {report.status !== "verified" && report.status !== "resolved" && (
            <button
              onClick={() => adminSetStatus(report.id, "verified").catch(() => {})}
              className="focus-ring rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold px-2.5 py-1 ring-1 ring-brand-200"
            >
              Verify
            </button>
          )}
          {report.status !== "rejected" && report.status !== "resolved" && (
            <button
              onClick={() => adminSetStatus(report.id, "rejected").catch(() => {})}
              className="focus-ring rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 ring-1 ring-red-200"
            >
              Reject
            </button>
          )}
          {report.status !== "resolved" && (
            <button
              onClick={() => adminSetStatus(report.id, "resolved").catch(() => {})}
              className="focus-ring rounded-lg bg-ink-900/5 hover:bg-ink-900/10 text-ink-900/70 text-xs font-semibold px-2.5 py-1 ring-1 ring-ink-900/10"
            >
              Mark resolved
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
