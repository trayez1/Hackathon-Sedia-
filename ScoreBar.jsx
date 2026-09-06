function tone(score) {
  if (score >= 75) return { bar: "bg-brand-500", text: "text-brand-700", ring: "ring-brand-200", bg: "bg-brand-50" };
  if (score >= 45) return { bar: "bg-amber-500", text: "text-amber-700", ring: "ring-amber-200", bg: "bg-amber-50" };
  return { bar: "bg-red-500", text: "text-red-700", ring: "ring-red-200", bg: "bg-red-50" };
}

export default function ScoreBar({ score, size = "md", label = "okayUway Accessibility Score" }) {
  const t = tone(score);
  const big = size === "lg";
  return (
    <div>
      <div className="flex items-end justify-between mb-1">
        <span className={`text-xs font-medium uppercase tracking-wide text-ink-900/60`}>{label}</span>
        <span className={`${big ? "text-3xl" : "text-xl"} font-bold ${t.text}`} aria-label={`Score ${score} out of 100`}>
          {score}<span className="text-sm font-medium text-ink-900/50">/100</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`w-full ${big ? "h-3.5" : "h-2.5"} rounded-full bg-ink-900/10 overflow-hidden`}
      >
        <div
          className={`h-full ${t.bar} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
