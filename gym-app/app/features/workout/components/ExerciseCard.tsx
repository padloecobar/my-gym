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
    <article className="ui-card card exercise-card" data-surface="1">
      <div className="ui-card__body card__body">
        <div className="exercise-card__header">
          <div>
            <h3 className="ui-card__title card__title">{exercise.name}</h3>
            <div className="cluster">
              <span className="ui-badge badge" data-variant="neutral">
                {exercise.type}
              </span>
              {entry.suggested ? (
                <span className="ui-badge badge badge--brand" data-variant="primary">
                  Suggested
                </span>
              ) : null}
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
          <button
            type="button"
            className="ui-button button button--primary button--sm exercise-card__add"
            data-variant="primary"
            data-size="sm"
            onClick={onAddSet}
          >
            + Add set
          </button>
        </div>
      </div>
    </article>
  );
}
