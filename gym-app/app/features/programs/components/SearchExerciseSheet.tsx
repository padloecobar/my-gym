"use client";

import { useMemo, useState } from "react";
import BottomSheet from "../../../shared/components/BottomSheet";
import { useCatalogShallow } from "../../../../store/useCatalogStore";
import { useUiShallow } from "../../../../store/useUiStore";
import type { Exercise, ExerciseType, InputMode } from "../../../../types/gym";

const exerciseTypes: ExerciseType[] = ["Barbell", "Dumbbell", "Machine", "Bodyweight", "Cable"];

export default function SearchExerciseSheet() {
  const { sheet, closeSheet } = useUiShallow((state) => ({
    sheet: state.sheet,
    closeSheet: state.closeSheet,
  }));
  const { exercises, addExerciseToProgram, createExercise } = useCatalogShallow((state) => ({
    exercises: state.exercises,
    addExerciseToProgram: state.addExerciseToProgram,
    createExercise: state.createExercise,
  }));

  if (sheet.type !== "searchExercise") return null;

  return (
    <BottomSheet
      open={sheet.open}
      title="Add exercise"
      onClose={closeSheet}
    >
      <SearchExerciseForm
        key={sheet.sessionId}
        exercises={exercises}
        onClose={closeSheet}
        onSelect={(exerciseId) => {
          addExerciseToProgram(sheet.payload.programId, exerciseId);
          closeSheet();
        }}
        onCreate={(name, type, mode) => {
          const nextMode = type === "Barbell" ? mode : "total";
          const newId = createExercise(name, type, nextMode);
          addExerciseToProgram(sheet.payload.programId, newId);
          closeSheet();
        }}
      />
    </BottomSheet>
  );
}

function SearchExerciseForm({
  exercises,
  onClose,
  onSelect,
  onCreate,
}: {
  exercises: Exercise[];
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
  onCreate: (name: string, type: ExerciseType, mode: InputMode) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ExerciseType>("Barbell");
  const [mode, setMode] = useState<InputMode>("plates");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return exercises;
    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(normalized));
  }, [exercises, query]);

  return (
    <>
      <form
        id="search-exercise-form"
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          const name = query.trim();
          if (!name) return;
          onCreate(name, type, mode);
        }}
      >
        <div className="ui-field field">
          <label className="ui-label label" htmlFor="exercise-search">
            Search or create
          </label>
          <input
            id="exercise-search"
            className="ui-input input"
            placeholder="e.g. Overhead Press"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="ui-field field">
          <label className="ui-label label" htmlFor="exercise-type">
            Type
          </label>
          <select
            id="exercise-type"
            className="ui-select select"
            value={type}
            onChange={(event) => {
              const nextType = event.target.value as ExerciseType;
              setType(nextType);
              setMode(nextType === "Barbell" ? "plates" : "total");
            }}
          >
            {exerciseTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {type === "Barbell" ? (
          <div className="ui-field field">
            <span className="ui-label label">Default mode</span>
            <div className="segmented">
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
            </div>
          </div>
        ) : null}
      </form>

      <div className="ui-sheet__list sheet__list">
        <p className="ui-label label">Matches</p>
        <div className="stack">
          {results.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              className="ui-row list-row"
              data-density="comfortable"
              onClick={() => onSelect(exercise.id)}
            >
              <span>{exercise.name}</span>
              <span className="ui-badge badge" data-variant="neutral">
                {exercise.type}
              </span>
            </button>
          ))}
          {results.length === 0 ? <p className="muted">No matches yet.</p> : null}
        </div>
      </div>

      <div className="ui-sheet__actions sheet__actions">
        <button type="button" className="ui-button button button--ghost" data-variant="ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          className="ui-button button button--primary"
          data-variant="primary"
          form="search-exercise-form"
        >
          Create
        </button>
      </div>
    </>
  );
}
