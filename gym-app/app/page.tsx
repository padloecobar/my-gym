"use client";

import { useRouter } from "next/navigation";
import HeaderBar from "./components/HeaderBar";
import ProgramCard from "./components/ProgramCard";
import { useCatalogShallow } from "../store/useCatalogStore";
import { useSessionShallow, useSessionStoreApi } from "../store/useSessionStore";
import { useUiShallow, useUiStoreApi } from "../store/useUiStore";
import { navigateWithTransition } from "../lib/navigation";
import { formatTime } from "../lib/utils";

export default function TodayPage() {
  const router = useRouter();
  const { programs } = useCatalogShallow((state) => ({ programs: state.programs }));
  const { activeWorkoutId, workoutsById } = useSessionShallow((state) => ({
    activeWorkoutId: state.activeWorkoutId,
    workoutsById: state.workoutsById,
  }));
  const sessionStore = useSessionStoreApi();
  const { vtHero } = useUiShallow((state) => ({ vtHero: state.vtHero }));
  const uiStore = useUiStoreApi();

  const activeWorkout = activeWorkoutId ? workoutsById[activeWorkoutId] : undefined;
  const activeProgram = activeWorkout
    ? programs.find((program) => program.id === activeWorkout.programId)
    : undefined;

  const handleStart = (programId: string) => {
    const workoutId = sessionStore.getState().startWorkout(programId);
    if (!workoutId) return;
    uiStore.getState().setVtHero({ type: "program", id: programId });
    navigateWithTransition(router, `/workout/${workoutId}`);
  };

  const handleResume = () => {
    if (!activeWorkout) return;
    uiStore.getState().setVtHero({ type: "program", id: activeWorkout.programId });
    navigateWithTransition(router, `/workout/${activeWorkout.id}`);
  };

  return (
    <div className="page container">
      <HeaderBar title="Today" />

      {activeWorkout && activeProgram ? (
        <div className="resume-card">
          <button
            type="button"
            className={`card program-card ${
              vtHero?.type === "program" && vtHero.id === activeProgram.id ? "vt-hero" : ""
            }`}
            onClick={handleResume}
          >
            <div className="card__body">
              <div className="program-card__header">
                <h3 className="card__title">Resume {activeProgram.name}</h3>
                <span className="badge badge--brand">Active</span>
              </div>
              <p className="card__meta">Started {formatTime(activeWorkout.startedAt)}</p>
            </div>
          </button>
        </div>
      ) : null}

      <section className="page__section">
        <h2 className="card__title">Programs</h2>
        <div className="stack virtual-list">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              meta={`${program.exerciseIds.length} exercises`}
              onClick={() => handleStart(program.id)}
              actionLabel="Start"
              hero={vtHero?.type === "program" && vtHero.id === program.id}
            />
          ))}
          {programs.length === 0 ? (
            <div className="card">
              <div className="card__body">
                <p>No programs yet. Build one to get moving.</p>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => navigateWithTransition(router, "/programs")}
                >
                  Create a program
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
