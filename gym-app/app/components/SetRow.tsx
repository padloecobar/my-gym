"use client";

import { useMemo } from "react";
import type { SetEntry } from "../../types/gym";
import { formatKg, formatLb } from "../../lib/utils";

export default function SetRow({
  set,
  isNext,
  barWeight,
  onToggle,
  onEdit,
  onDelete,
}: {
  set: SetEntry;
  isNext: boolean;
  barWeight: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const perSide = useMemo(() => Math.max(0, (set.weightKg - barWeight) / 2), [set.weightKg, barWeight]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`set-row${set.completed ? " is-complete" : ""}${isNext ? " is-next" : ""}`}
      aria-label={`${formatKg(set.weightKg)} kg x ${set.reps} reps`}
      aria-pressed={set.completed}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <div className="set-row__weight">
        <button
          type="button"
          className="set-row__edit"
          aria-label="Edit weight and reps"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          <span className="set-row__kg">{formatKg(set.weightKg)} kg</span>
          <span className="set-row__lb muted">{formatLb(set.weightKg)} lb</span>
          {set.mode === "plates" ? (
            <span className="set-row__plates muted">{formatKg(perSide)} kg / side</span>
          ) : null}
        </button>
      </div>
      <div className="set-row__reps">
        <button
          type="button"
          className="set-row__edit"
          aria-label="Edit weight and reps"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          <span className="set-row__reps-value">{set.reps}</span>
          <span className="set-row__reps-label muted">reps</span>
        </button>
      </div>
      <div className="set-row__meta">
        <button
          type="button"
          className="set-row__menu"
          aria-label="Delete set"
          title="Delete set"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" focusable="false" aria-hidden="true">
            <path
              d="M9 3h6l1 2h4v2H4V5h4l1-2Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 7l1 13h10l1-13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 11v6M14 11v6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="sr-only">Delete set</span>
        </button>
      </div>
    </div>
  );
}
