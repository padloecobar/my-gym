"use client";

import { useMemo, useState, type FormEvent } from "react";
import BottomSheet from "./BottomSheet";
import { useGymStore } from "../../store/gym";
import { clamp, formatKg, formatLb } from "../../lib/utils";
import type { Exercise, SetEntry, Settings } from "../../types/gym";

export default function EditSetSheet() {
  const sheet = useGymStore((state) => state.ui.sheet);
  const closeSheet = useGymStore((state) => state.closeSheet);
  const updateSet = useGymStore((state) => state.updateSet);
  const settings = useGymStore((state) => state.settings);
  const payload = sheet.type === "editSet" ? sheet.payload : null;

  const workout = useGymStore((state) =>
    payload ? state.workouts.find((item) => item.id === payload.workoutId) : undefined
  );
  const entry = workout?.entries.find((item) => item.exerciseId === payload?.exerciseId);
  const setEntry = entry?.sets.find((item) => item.id === payload?.setId);
  const exercise = useGymStore((state) =>
    payload ? state.exercises.find((item) => item.id === payload.exerciseId) : undefined
  );

  if (sheet.type !== "editSet" || !payload || !setEntry || !exercise) return null;

  const formKey = `${setEntry.id}-${sheet.sessionId}`;

  return (
    <BottomSheet
      open={sheet.open}
      title={`${exercise.name} set`}
      onClose={closeSheet}
      footer={
        <div className="sheet__actions">
          <button type="button" className="btn btn--ghost" onClick={closeSheet}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" form="edit-set-form">
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
          updateSet(payload.workoutId, payload.exerciseId, payload.setId, next);
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
  const [weight, setWeight] = useState(setEntry.weightKg);
  const [reps, setReps] = useState(setEntry.reps);
  const [mode, setMode] = useState<"total" | "plates">(setEntry.mode);

  const perSide = useMemo(
    () => Math.max(0, (weight - settings.defaultBarWeight) / 2),
    [weight, settings.defaultBarWeight]
  );

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      weightKg: clamp(weight, 0, 1000),
      reps: clamp(reps, 0, 200),
      mode,
    });
  };

  const handleWeightChange = (value: number) => {
    if (mode === "plates") {
      const total = settings.defaultBarWeight + value * 2;
      setWeight(clamp(total, 0, 1000));
    } else {
      setWeight(clamp(value, 0, 1000));
    }
  };

  const weightDisplay = mode === "plates" ? perSide : weight;

  return (
    <form id="edit-set-form" className="stack" onSubmit={handleSave}>
      <div className="field">
        <label className="label" htmlFor="weight-input">
          Weight ({mode === "plates" ? "per side" : "total"})
        </label>
        <div className="stepper">
          <button type="button" className="btn" onClick={() => handleWeightChange(weightDisplay - 2.5)}>
            -
          </button>
          <input
            id="weight-input"
            className="input"
            inputMode="decimal"
            value={weightDisplay}
            onChange={(event) => {
              const next = Number(event.target.value);
              handleWeightChange(Number.isFinite(next) ? next : 0);
            }}
          />
          <button type="button" className="btn" onClick={() => handleWeightChange(weightDisplay + 2.5)}>
            +
          </button>
        </div>
        <div className="help">
          {formatKg(weight)} kg / {formatLb(weight)} lb
        </div>
        {mode === "plates" ? (
          <div className="help">Bar weight {formatKg(settings.defaultBarWeight)} kg</div>
        ) : null}
      </div>

      <div className="field">
        <label className="label" htmlFor="reps-input">
          Reps
        </label>
        <div className="stepper">
          <button type="button" className="btn" onClick={() => setReps(clamp(reps - 1, 0, 200))}>
            -
          </button>
          <input
            id="reps-input"
            className="input"
            inputMode="numeric"
            value={reps}
            onChange={(event) => {
              const next = Number(event.target.value);
              setReps(clamp(Number.isFinite(next) ? next : 0, 0, 200));
            }}
          />
          <button type="button" className="btn" onClick={() => setReps(clamp(reps + 1, 0, 200))}>
            +
          </button>
        </div>
      </div>

      {exercise.type === "Barbell" ? (
        <div className="field">
          <span className="label">Mode</span>
          <div className="cluster">
            <button
              type="button"
              className={`btn${mode === "total" ? " btn--primary" : ""}`}
              onClick={() => setMode("total")}
            >
              Total
            </button>
            <button
              type="button"
              className={`btn${mode === "plates" ? " btn--primary" : ""}`}
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
