import type { Exercise, SetEntry, SettingsState } from "../lib/types";
import { formatKg, formatLb, toKg } from "../lib/calc";
import { formatShortTime } from "../lib/date";

const typeLabel = (type: Exercise["type"]) => {
  switch (type) {
    case "barbell":
      return "Barbell";
    case "dumbbell":
      return "Dumbbell";
    case "machine":
      return "Machine";
    case "bodyweight":
      return "Bodyweight";
    default:
      return type;
  }
};

type ExerciseCardProps = {
  exercise: Exercise;
  lastSet?: SetEntry | null;
  todaySets: SetEntry[];
  settings: SettingsState;
  onAddSet: () => void;
  onSame: () => void;
  onSameDouble: () => void;
  onUndoLast: () => void;
  onEditSet: (set: SetEntry) => void;
  highlightSetId?: string | null;
};

const ExerciseCard = ({
  exercise,
  lastSet,
  todaySets,
  settings,
  onAddSet,
  onSame,
  onSameDouble,
  onUndoLast,
  onEditSet,
  highlightSetId,
}: ExerciseCardProps) => {
  const unitDisplay = settings.unitDisplay;
  const showLb = unitDisplay === "both" || unitDisplay === "lb";
  const showKg = unitDisplay === "both" || unitDisplay === "kg";
  const isBodyweight = exercise.type === "bodyweight";
  const isDumbbell = exercise.type === "dumbbell";
  const isBarbell = exercise.type === "barbell";

  const lastLabel = lastSet
    ? isBodyweight
      ? `BWx${lastSet.reps}`
      : `${formatLb(lastSet.inputLb)}x${lastSet.reps}`
    : null;

  const weightStep = isBarbell ? 2.5 : 5;
  const targetLabel =
    lastSet && !isBodyweight
      ? `${formatLb(lastSet.inputLb + weightStep)}x${lastSet.reps}`
      : lastSet
        ? `BWx${lastSet.reps + 1}`
        : null;

  const lastTime = todaySets[0] ? formatShortTime(todaySets[0].ts) : null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-4 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--muted)] font-mono">
            {typeLabel(exercise.type)}
          </div>
          <div className="mt-1 text-lg font-semibold text-[color:var(--text)] font-serif">
            {exercise.name}
          </div>
          {lastSet && !isBodyweight ? (
            <div className="mt-1 text-[11px] text-[color:var(--muted)]">
              {isBarbell
                ? `Per side ${formatLb(lastSet.inputLb)} lb`
                : isDumbbell
                  ? `Per dumbbell ${formatLb(lastSet.inputLb)} lb`
                  : `Weight ${formatLb(lastSet.inputLb)} lb`}
              {isBarbell ? ` · Bar ${lastSet.barLbSnapshot} lb` : ""}
            </div>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Last
          </div>
          <div className="mt-1 text-base font-semibold text-[color:var(--text)] font-mono">
            {lastLabel ?? "--"}
          </div>
          {lastSet ? (
            !isBodyweight ? (
              <div className="text-[11px] text-[color:var(--muted)] font-mono">
                {showLb ? `${formatLb(lastSet.totalLb)} lb` : null}
                {showLb && showKg ? " | " : null}
                {showKg
                  ? `${formatKg(
                      toKg(lastSet.totalLb, settings.roundingKg),
                      settings.roundingKg,
                    )} kg`
                  : null}
              </div>
            ) : (
              <div className="text-[11px] text-[color:var(--muted)]">
                Bodyweight
              </div>
            )
          ) : (
            <div className="text-[11px] text-[color:var(--muted)]">
              No history
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[color:var(--muted)]">
        <span>
          {todaySets.length} sets today{lastTime ? ` · Last ${lastTime}` : ""}
        </span>
        {targetLabel ? <span>Target {targetLabel}</span> : null}
      </div>

      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={lastSet ? onSame : onAddSet}
          className="min-h-[48px] w-full rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-ink)]"
        >
          {lastSet && lastLabel ? `Log ${lastLabel}` : "Custom log"}
        </button>
        {lastSet ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onSameDouble}
              className="min-h-[44px] rounded-2xl border border-[var(--border)] bg-transparent px-3 text-xs uppercase tracking-[0.25em] text-[color:var(--text)]"
            >
              {lastLabel ? `Log 2x ${lastLabel}` : "Log 2x"}
            </button>
            <button
              type="button"
              onClick={onAddSet}
              className="min-h-[44px] rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]"
            >
              Custom
            </button>
          </div>
        ) : null}
      </div>

      {todaySets.length ? (
        <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
              Today
            </div>
            <button
              type="button"
              onClick={onUndoLast}
              className="min-h-[36px] rounded-full border border-[var(--border)] px-3 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]"
            >
              Undo last
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {todaySets.map((set) => {
              const isHighlighted = set.id === highlightSetId;
              return (
                <button
                  key={set.id}
                  type="button"
                  onClick={() => onEditSet(set)}
                  className={`min-h-[36px] rounded-full border border-[var(--border)] bg-[color:var(--bg-card)] px-3 text-xs text-[color:var(--text)] font-mono ${
                    isHighlighted ? "ring-2 ring-[color:var(--accent-2)]" : ""
                  }`}
                >
                  {isBodyweight ? "BW" : formatLb(set.inputLb)}x{set.reps}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ExerciseCard;
