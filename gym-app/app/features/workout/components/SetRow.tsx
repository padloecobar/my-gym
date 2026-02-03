"use client";

import { useMemo } from "react";
import type { SetEntry } from "../../../../types/gym";
import { formatKg, formatLb, formatWeight } from "../../../shared/lib/utils";
import { TrashIcon } from "../../../shared/components/icons/TrashIcon";

export default function SetRow({
  set,
  barWeight,
  onEdit,
  onDelete,
  highlight,
  showPerSide = false,
}: {
  set: SetEntry;
  barWeight: number;
  onEdit: () => void;
  onDelete: () => void;
  highlight?: boolean;
  showPerSide?: boolean;
}) {
  const perSide = useMemo(() => {
    if (!showPerSide) return 0;
    return Math.max(0, (set.weightKg - barWeight) / 2);
  }, [barWeight, set.weightKg, showPerSide]);

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
      aria-label={`${formatWeight(set.weightKg)} x ${set.reps} reps. Tap to edit.`}
      onClick={onEdit}
      onKeyDown={handleKeyDown}
    >
      <div className="set-row__stats">
        <button
          type="button"
          className="set-row__edit set-row__stat set-row__stat--weight"
          aria-label="Edit weight and reps"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
        >
          <span className="set-row__label">Total</span>
          <span className="set-row__values">
            <span className="pill pill--strong">
              <span className="pill__value tabular-nums">{formatKg(set.weightKg)}</span>
              <span className="pill__label">kg</span>
            </span>
            <span className="pill">
              <span className="pill__value tabular-nums">{formatLb(set.weightKg)}</span>
              <span className="pill__label">lb</span>
            </span>
          </span>
          {showPerSide ? (
            <span className="set-row__sub muted tabular-nums">
              Per side {formatKg(perSide)} kg · {formatLb(perSide)} lb
            </span>
          ) : null}
        </button>
        <div className="set-row__actions">
          <button
            type="button"
            className="set-row__edit set-row__stat set-row__stat--reps"
            aria-label="Edit weight and reps"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            <span className="pill pill--strong">
              <span className="pill__value tabular-nums">{set.reps}</span>
              <span className="pill__label">reps</span>
            </span>
          </button>
          <button
            type="button"
            className="button button--ghost icon-button set-row__action"
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
    </div>
  );
}
