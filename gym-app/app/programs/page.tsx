"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import HeaderBar from "../shared/components/HeaderBar";
import BackButton from "../shared/components/BackButton";
import ProgramCard from "../features/programs/components/ProgramCard";
import type { Command } from "../../commands/types";
import { useCatalogShallow, useCatalogStoreApi } from "../../store/useCatalogStore";
import { useUiStoreApi } from "../../store/useUiStore";
import { navigateWithTransition } from "../../app/shared/lib/navigation";
import { TrashIcon } from "../shared/components/icons/TrashIcon";

export default function ProgramsPage() {
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") ?? undefined;
  const showDetail = Boolean(programId);
  const router = useRouter();

  const { programs, exercises } = useCatalogShallow((state) => ({
    programs: state.programs,
    exercises: state.exercises,
  }));
  const catalogStore = useCatalogStoreApi();
  const uiStore = useUiStoreApi();
  const { updateProgram, reorderProgramExercise, moveProgramExercise, removeExerciseFromProgram, createProgram } =
    catalogStore.getState();
  const { openSearchExercise, openConfirm } = uiStore.getState();

  const [dragId, setDragId] = useState<string | null>(null);

  const program = programId ? programs.find((item) => item.id === programId) : undefined;

  const handleNewProgram = () => {
    const id = createProgram();
    navigateWithTransition(router, `/programs?programId=${encodeURIComponent(id)}`);
  };

  if (showDetail) {
    if (!program) {
      return (
        <div className="page container">
          <HeaderBar title="Program" />
          <BackButton />
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
        <BackButton />

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
            <button
              type="button"
              className="button button--ghost"
              onClick={() => openSearchExercise({ programId: program.id })}
            >
              + Add
            </button>
          </div>

          <div className="stack virtual-list list-surface">
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
                      className="button button--secondary"
                      aria-label={`Move ${exercise.name} up`}
                      onClick={() => moveProgramExercise(program.id, exercise.id, "up")}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className="button button--secondary"
                      aria-label={`Move ${exercise.name} down`}
                      onClick={() => moveProgramExercise(program.id, exercise.id, "down")}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
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

        <section className="page__section">
          <div className="card">
            <div className="card__body stack">
              <div>
                <h2 className="card__title">Danger zone</h2>
                <p className="card__meta">Deleting a program keeps your workout history intact.</p>
              </div>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  const command: Command = {
                    type: "DELETE_PROGRAM",
                    payload: { programId: program.id, navigateTo: "/programs" },
                  };
                  openConfirm({
                    title: "Delete program?",
                    message: "This removes the program from your list. Workouts already logged stay in history.",
                    confirmLabel: "Delete program",
                    tone: "danger",
                    command,
                  });
                }}
              >
                <TrashIcon size="sm" />
                <span>Delete program</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page container">
      <HeaderBar title="Programs" />

      <div className="stack virtual-list list-surface">
        {programs.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            meta={`${program.exerciseIds.length} exercises`}
            href={`/programs?programId=${encodeURIComponent(program.id)}`}
            actionLabel="Edit"
          />
        ))}
      </div>

      <button type="button" className="button button--primary fab" onClick={handleNewProgram}>
        +
      </button>
    </div>
  );
}
