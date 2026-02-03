"use client";

import { useMemo, useState, type FormEvent } from "react";
import BottomSheet from "../../../shared/components/BottomSheet";
import { useCatalogShallow } from "../../../../store/useCatalogStore";
import { useSessionStore, useSessionStoreApi } from "../../../../store/useSessionStore";
import { useSettingsShallow } from "../../../../store/useSettingsStore";
import { useUiShallow } from "../../../../store/useUiStore";
import { clamp, formatWeight, kgToLb, lbToKg } from "../../../shared/lib/utils";
import type { Exercise, SetEntry, Settings } from "../../../../types/gym";

export default function EditSetSheet() {
  const { sheet, closeSheet } = useUiShallow((state) => ({
    sheet: state.sheet,
    closeSheet: state.closeSheet,
  }));
  const sessionStore = useSessionStoreApi();
  const { settings } = useSettingsShallow((state) => ({ settings: state.settings }));
  const payload = sheet.type === "editSet" ? sheet.payload : null;

  const setEntry = useSessionStore((state) => (payload ? state.setsById[payload.setId] : undefined));
  const { exercise } = useCatalogShallow((state) => ({
    exercise: payload ? state.exercises.find((item) => item.id === payload.exerciseId) : undefined,
  }));

  if (sheet.type !== "editSet" || !payload || !setEntry || !exercise) return null;

  const formKey = `${setEntry.id}-${sheet.sessionId}`;

  return (
    <BottomSheet
      open={sheet.open}
      title={`${exercise.name} set`}
      onClose={closeSheet}
      footer={
        <div className="ui-sheet__actions sheet__actions">
          <button type="button" className="ui-button button button--ghost" data-variant="ghost" onClick={closeSheet}>
            Cancel
          </button>
          <button
            type="submit"
            className="ui-button button button--primary"
            data-variant="primary"
            form="edit-set-form"
          >
            Save
          </button>
        </div>
      }
    >
      <EditSetForm
        key={formKey}
        setEntry={setEntry}
        exercise={exercise}
        settings={settings}
        onSave={(next) => {
          sessionStore.getState().updateSet(payload.workoutId, payload.exerciseId, payload.setId, next);
          closeSheet();
        }}
      />
    </BottomSheet>
  );
}

type EditSetFormProps = {
  setEntry: SetEntry;
  exercise: Exercise;
  settings: Settings;
  onSave: (patch: Pick<SetEntry, "weightKg" | "reps" | "mode">) => void;
};

function EditSetForm({ setEntry, exercise, settings, onSave }: EditSetFormProps) {
  const [weight, setWeight] = useState(setEntry.weightKg); // canonical total kg stored
  const [reps, setReps] = useState(setEntry.reps);
  const [mode, setMode] = useState<"total" | "plates">(
    exercise.type === "Barbell" ? "plates" : setEntry.mode
  );
  const inputUnits = settings.unitsPreference;
  const perSideKg = useMemo(
    () => Math.max(0, (weight - settings.defaultBarWeight) / 2),
    [weight, settings.defaultBarWeight]
  );

  const perSideInput = useMemo(
    () => (inputUnits === "lb" ? kgToLb(perSideKg) : perSideKg),
    [inputUnits, perSideKg]
  );
  const totalInput = useMemo(() => (inputUnits === "lb" ? kgToLb(weight) : weight), [inputUnits, weight]);

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      weightKg: clamp(weight, 0, 1000),
      reps: clamp(reps, 0, 200),
      mode,
    });
  };

  /**
   * In "total" mode: value is in input units.
   * In "plates" mode: value is per-side in input units, we convert to total kg:
   * totalKg = barKg + 2 * perSideKg
   */
  const handleWeightChange = (value: number) => {
    if (mode === "plates") {
      const perSideInputClamped = clamp(value, 0, 2000);
      const perSideKg = inputUnits === "lb" ? lbToKg(perSideInputClamped) : perSideInputClamped;
      const totalKg = settings.defaultBarWeight + perSideKg * 2;
      setWeight(clamp(totalKg, 0, 1000));
    } else {
      const totalKg = inputUnits === "lb" ? lbToKg(value) : value;
      setWeight(clamp(totalKg, 0, 1000));
    }
  };

  // Display value: per-side or total in input units
  const weightDisplay = mode === "plates" ? perSideInput : totalInput;
  const weightDisplayValue = Number.isFinite(weightDisplay) ? Math.round(weightDisplay * 100) / 100 : 0;

  // Step sizes in input units
  const step = 2.5;

  return (
    <form id="edit-set-form" className="stack" onSubmit={handleSave}>
      <div className="ui-field field">
        <label className="ui-label label" htmlFor="weight-input">
          {mode === "plates" ? `Weight per side (${inputUnits})` : `Total weight (${inputUnits})`}
        </label>

        <div className="stepper">
          <button
            type="button"
            className="ui-button button"
            data-variant="secondary"
            data-size="sm"
            onClick={() => handleWeightChange(weightDisplayValue - step)}
          >
            -
          </button>

          <input
            id="weight-input"
            className="ui-input input"
            inputMode="decimal"
            value={weightDisplayValue}
            onChange={(event) => {
              const next = Number(event.target.value);
              handleWeightChange(Number.isFinite(next) ? next : 0);
            }}
          />

          <button
            type="button"
            className="ui-button button"
            data-variant="secondary"
            data-size="sm"
            onClick={() => handleWeightChange(weightDisplayValue + step)}
          >
            +
          </button>
        </div>

        <div className="ui-help help">{formatWeight(weight)}</div>

        {mode === "plates" ? (
          <div className="ui-help help">
            Bar weight {formatWeight(settings.defaultBarWeight)}
          </div>
        ) : null}
      </div>

      <div className="ui-field field">
        <label className="ui-label label" htmlFor="reps-input">
          Reps
        </label>
        <div className="stepper">
          <button
            type="button"
            className="ui-button button"
            data-variant="secondary"
            data-size="sm"
            onClick={() => setReps(clamp(reps - 1, 0, 200))}
          >
            -
          </button>
          <input
            id="reps-input"
            className="ui-input input"
            inputMode="numeric"
            value={reps}
            onChange={(event) => {
              const next = Number(event.target.value);
              setReps(clamp(Number.isFinite(next) ? next : 0, 0, 200));
            }}
          />
          <button
            type="button"
            className="ui-button button"
            data-variant="secondary"
            data-size="sm"
            onClick={() => setReps(clamp(reps + 1, 0, 200))}
          >
            +
          </button>
        </div>
      </div>

      {exercise.type === "Barbell" ? (
        <div className="ui-field field">
          <span className="ui-label label">Mode</span>
          <div className="segmented">
            <button
              type="button"
              className={`ui-button button${mode === "total" ? " button--primary" : ""}`}
              data-variant={mode === "total" ? "primary" : "ghost"}
              data-state={mode === "total" ? "selected" : "default"}
              data-size="sm"
              onClick={() => setMode("total")}
            >
              Total
            </button>
            <button
              type="button"
              className={`ui-button button${mode === "plates" ? " button--primary" : ""}`}
              data-variant={mode === "plates" ? "primary" : "ghost"}
              data-state={mode === "plates" ? "selected" : "default"}
              data-size="sm"
              onClick={() => setMode("plates")}
            >
              Plates / side
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
