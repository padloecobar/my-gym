"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import HeaderBar from "../../components/HeaderBar";
import { useGymStore } from "../../../store/gym";

export default function ProgramDetailPage() {
  const params = useParams<{ programId: string }>();
  const program = useGymStore((state) => state.programs.find((item) => item.id === params.programId));
  const exercises = useGymStore((state) => state.exercises);
  const updateProgram = useGymStore((state) => state.updateProgram);
  const reorderProgramExercise = useGymStore((state) => state.reorderProgramExercise);
  const moveProgramExercise = useGymStore((state) => state.moveProgramExercise);
  const removeExerciseFromProgram = useGymStore((state) => state.removeExerciseFromProgram);
  const openSearchExercise = useGymStore((state) => state.openSearchExercise);

  const [dragId, setDragId] = useState<string | null>(null);

  if (!program) {
    return (
      <div className="page">
        <p>Program not found.</p>
      </div>
    );
  }

  const orderedExercises = program.exerciseIds
    .map((id) => exercises.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise));

  return (
    <div className="page container">
      <HeaderBar title="Program" subtitle={<span className="muted">{program.name}</span>} />

      <div className="card">
        <div className="card__body stack">
          <div className="field">
            <label className="label" htmlFor="program-name">
              Name
            </label>
            <input
              id="program-name"
              className="input"
              value={program.name}
              onChange={(event) => updateProgram(program.id, { name: event.target.value })}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="program-note">
              Note
            </label>
            <textarea
              id="program-note"
              className="textarea"
              value={program.note ?? ""}
              onChange={(event) => updateProgram(program.id, { note: event.target.value })}
            />
          </div>
        </div>
      </div>

      <section className="page__section">
        <div className="cluster cluster--between">
          <h2 className="card__title">Exercises</h2>
          <button type="button" className="btn btn--ghost" onClick={() => openSearchExercise({ programId: program.id })}>
            + Add
          </button>
        </div>

        <div className="stack virtual-list">
          {orderedExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="card"
              draggable
              onDragStart={() => setDragId(exercise.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!dragId || dragId === exercise.id) return;
                reorderProgramExercise(program.id, dragId, exercise.id);
                setDragId(null);
              }}
            >
              <div className="card__body stack">
                <div className="cluster cluster--between">
                  <div>
                    <h3 className="card__title">{exercise.name}</h3>
                    <p className="card__meta">{exercise.type}</p>
                  </div>
                  <span className="badge">Drag</span>
                </div>
                <div className="cluster">
                  <button
                    type="button"
                    className="btn"
                    aria-label={`Move ${exercise.name} up`}
                    onClick={() => moveProgramExercise(program.id, exercise.id, "up")}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="btn"
                    aria-label={`Move ${exercise.name} down`}
                    onClick={() => moveProgramExercise(program.id, exercise.id, "down")}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    aria-label={`Remove ${exercise.name}`}
                    onClick={() => removeExerciseFromProgram(program.id, exercise.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          {orderedExercises.length === 0 ? <p className="muted">Add exercises to define the order.</p> : null}
        </div>
      </section>
    </div>
  );
}
