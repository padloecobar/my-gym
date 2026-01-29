"use client";

import { useMemo } from "react";
import type { SetEntry } from "../../../../types/gym";
import { formatKg, formatLb } from "../../../shared/lib/utils";
import { TrashIcon } from "../../../shared/components/icons/TrashIcon";

export default function SetRow({
  set,
  barWeight,
  onEdit,
  onDelete,
  highlight,
}: {
  set: SetEntry;
  barWeight: number;
  onEdit: () => void;
  onDelete: () => void;
  highlight?: boolean;
}) {
  const perSide = useMemo(() => Math.max(0, (set.weightKg - barWeight) / 2), [set.weightKg, barWeight]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onEdit();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`set-row${highlight ? " set-row--highlight" : ""}`}
      aria-label={`${formatKg(set.weightKg)} kg x ${set.reps} reps. Tap to edit.`}
      onClick={onEdit}
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
          <TrashIcon size="sm" />
        </button>
      </div>
    </div>
  );
}
