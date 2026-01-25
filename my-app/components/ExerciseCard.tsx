import type { Exercise, SetEntry, SettingsState } from "../lib/types";
import { formatKg, formatLb, toKg } from "../lib/calc";

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
}: ExerciseCardProps) => {
  const unitDisplay = settings.unitDisplay;
  const showLb = unitDisplay === "both" || unitDisplay === "lb";
  const showKg = unitDisplay === "both" || unitDisplay === "kg";
  const isBodyweight = exercise.type === "bodyweight";

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-[color:var(--text)]">
            {exercise.name}
          </div>
          <div className="mt-2 inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
            {typeLabel(exercise.type)}
          </div>
        </div>
        {lastSet ? (
          <div className="text-right text-xs text-[color:var(--muted)]">
            <div>Last</div>
            <div className="text-sm font-semibold text-[color:var(--text)]">
              {isBodyweight ? "BW" : formatLb(lastSet.inputLb)}x{lastSet.reps}
            </div>
            {!isBodyweight ? (
              <div className="text-xs">
                {showLb ? `${formatLb(lastSet.totalLb)} lb` : null}
                {showLb && showKg ? " | " : null}
                {showKg
                  ? `${formatKg(
                      toKg(lastSet.totalLb, settings.roundingKg),
                      settings.roundingKg,
                    )} kg`
                  : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSame}
          className="flex-1 rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black"
          disabled={!lastSet}
        >
          + Same
        </button>
        <button
          type="button"
          onClick={onSameDouble}
          className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]"
          disabled={!lastSet}
        >
          Same x2
        </button>
        <button
          type="button"
          onClick={onAddSet}
          className="flex-1 rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm text-[color:var(--text)]"
        >
          Add Set
        </button>
      </div>

      {todaySets.length ? (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Today
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {todaySets.map((set) => (
              <div
                key={set.id}
                className="rounded-full border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 py-1 text-xs text-[color:var(--text)]"
              >
                {isBodyweight ? "BW" : formatLb(set.inputLb)}x{set.reps}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onUndoLast}
            className="mt-3 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]"
          >
            Undo last set
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ExerciseCard;
