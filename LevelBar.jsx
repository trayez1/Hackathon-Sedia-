// Renders a level name + progress bar toward the next tier, from the
// `level` object the backend returns (see backend/src/services/pointsService.js
// getLevelInfo): { name, points, nextLevelName, nextThreshold, progressPercent }.
export default function LevelBar({ level }) {
  if (!level) return null;
  const maxed = !level.nextLevelName;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-ink-900">{level.name}</span>
        <span className="text-xs text-ink-900/60">
          {maxed ? `${level.points} points` : `${level.points} / ${level.nextThreshold} points`}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 rounded-full bg-ink-900/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-600 transition-[width]"
          style={{ width: `${level.progressPercent}%` }}
        />
      </div>
      {!maxed && (
        <p className="text-[11px] text-ink-900/45 mt-1">
          {Math.max(level.nextThreshold - level.points, 0)} points to {level.nextLevelName}
        </p>
      )}
    </div>
  );
}
