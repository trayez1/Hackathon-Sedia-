import { useEffect } from "react";

// Small, self-dismissing toast for "+N points" feedback. Kept intentionally
// plain (no slide/bounce animation) per the "don't make it excessive" brief —
// it fades in with the browser's default and clears itself after a few
// seconds.
export default function PointsToast({ message, onDone }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => onDone?.(), 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-xs rounded-xl bg-ink-900 text-white text-sm font-semibold px-4 py-3 shadow-lg ring-1 ring-white/10"
    >
      {message}
    </div>
  );
}
