import { timeAgo, isStale } from "../utils/time.js";

const TYPE_LABEL = {
  ramp: "Ramp", lift: "Lift", entrance: "Entrance", stairs: "Stairs",
  pavement: "Pavement", parking: "OKU Parking",
};

const STATUS_META = {
  good:    { icon: "✓", text: "Good condition", tone: "good" },
  working: { icon: "✓", text: "Working", tone: "good" },
  broken:  { icon: "🔴", text: "Broken", tone: "bad" },
  blocked: { icon: "🔴", text: "Blocked", tone: "bad" },
  damaged: { icon: "⚠", text: "Damaged", tone: "warn" },
  steep:   { icon: "⚠", text: "Steep gradient", tone: "warn" },
  unknown: { icon: "?", text: "Unverified", tone: "warn" },
};

const TONE_CLASS = {
  good: "bg-brand-50 text-brand-700 ring-brand-200",
  warn: "bg-amber-50 text-amber-800 ring-amber-200",
  bad:  "bg-red-50 text-red-700 ring-red-200",
};

export function FeatureBadge({ feature }) {
  const meta = STATUS_META[feature.status] || STATUS_META.unknown;
  const label = TYPE_LABEL[feature.type] || feature.type;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ${TONE_CLASS[meta.tone]}`}
      title={feature.description || `${label}: ${meta.text}`}
    >
      <span aria-hidden="true">{meta.icon}</span>
      <span>{label} — {meta.text}</span>
    </span>
  );
}

export function FreshnessChip({ iso }) {
  const stale = isStale(iso);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
        stale ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-ink-900/5 text-ink-900/70 ring-ink-900/10"
      }`}
    >
      {stale ? "⚠ May be outdated" : "🕒"} · Last verified {timeAgo(iso)}
    </span>
  );
}

export function ConfidenceChip({ confirmations, disputes }) {
  const total = confirmations + disputes;
  const pct = total === 0 ? 50 : Math.round((confirmations / total) * 100);
  const conflicting = disputes > 0 && disputes >= confirmations;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-full px-2.5 py-1 font-semibold ring-1 ${conflicting ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-brand-50 text-brand-700 ring-brand-200"}`}>
        {conflicting ? "Conflicting reports" : `Confidence: ${pct}%`}
      </span>
      <span className="text-ink-900/60">✓ {confirmations} confirmed</span>
      {disputes > 0 && <span className="text-ink-900/60">⚠ {disputes} disputed</span>}
    </div>
  );
}

export function SeverityBadge({ severity }) {
  const cls = severity === "HIGH" ? "bg-red-50 text-red-700 ring-red-200"
    : severity === "MEDIUM" ? "bg-amber-50 text-amber-800 ring-amber-200"
    : "bg-ink-900/5 text-ink-900/70 ring-ink-900/10";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>{severity}</span>;
}

export function StatusPill({ status }) {
  const map = {
    pending: { label: "Pending verification", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
    reviewing: { label: "Reviewing", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
    verified: { label: "Verified", cls: "bg-brand-50 text-brand-700 ring-brand-200" },
    resolved: { label: "Resolved", cls: "bg-ink-900/5 text-ink-900/70 ring-ink-900/10" },
    rejected: { label: "Rejected", cls: "bg-red-50 text-red-700 ring-red-200" },
  };
  const m = map[status] || map.pending;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${m.cls}`}>{m.label}</span>;
}
