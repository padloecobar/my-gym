"use client";

import type { Exercise, WorkoutEntry } from "../../../../types/gym";
import SetRow from "./SetRow";

export default function ExerciseCard({
  exercise,
  entry,
  barWeight,
  onEditSet,
  onDeleteSet,
  onAddSet,
  highlightedSetId,
}: {
  exercise: Exercise;
  entry: WorkoutEntry;
  barWeight: number;
  onEditSet: (setId: string) => void;
  onDeleteSet: (setId: string) => void;
  onAddSet: () => void;
  highlightedSetId?: string | null;
}) {
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
          {entry.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              barWeight={barWeight}
              onEdit={() => onEditSet(set.id)}
              onDelete={() => onDeleteSet(set.id)}
              highlight={highlightedSetId === set.id}
              showPerSide={exercise.type === "Barbell"}
            />
          ))}
        </div>
        <div className="exercise-card__actions">
          <button type="button" className="button button--primary button--sm exercise-card__add" onClick={onAddSet}>
            + Add set
          </button>
        </div>
      </div>
    </article>
  );
}
