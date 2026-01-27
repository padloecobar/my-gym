"use client";

import type { Exercise, WorkoutEntry } from "../../types/gym";
import SetRow from "./SetRow";

export default function ExerciseCard({
  exercise,
  entry,
  barWeight,
  onToggleSet,
  onEditSet,
  onDeleteSet,
  onAddSet,
}: {
  exercise: Exercise;
  entry: WorkoutEntry;
  barWeight: number;
  onToggleSet: (setId: string) => void;
  onEditSet: (setId: string) => void;
  onDeleteSet: (setId: string) => void;
  onAddSet: () => void;
}) {
  const nextIndex = entry.sets.findIndex((set) => !set.completed);

  return (
    <article className="card exercise-card">
      <div className="card__body">
        <div className="exercise-card__header">
          <div>
            <h3 className="card__title">{exercise.name}</h3>
            <div className="cluster">
              <span className="badge">{exercise.type}</span>
              {entry.suggested ? <span className="badge badge--brand">Suggested</span> : null}
            </div>
          </div>
        </div>
        <div className="exercise-card__sets">
          {entry.sets.map((set, index) => (
            <SetRow
              key={set.id}
              set={set}
              barWeight={barWeight}
              isNext={index === nextIndex}
              onToggle={() => onToggleSet(set.id)}
              onEdit={() => onEditSet(set.id)}
              onDelete={() => onDeleteSet(set.id)}
            />
          ))}
        </div>
        <button type="button" className="btn btn--ghost exercise-card__add" onClick={onAddSet}>
          + Add set
        </button>
      </div>
    </article>
  );
}
