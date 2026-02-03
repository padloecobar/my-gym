"use client";

import { useRouter } from "next/navigation";
import HeaderBar from "./shared/components/HeaderBar";
import ProgramCard from "./features/programs/components/ProgramCard";
import { useCatalogShallow } from "../store/useCatalogStore";
import { useSessionShallow, useSessionStoreApi } from "../store/useSessionStore";
import { useUiShallow, useUiStoreApi } from "../store/useUiStore";
import { navigateWithTransition } from "../app/shared/lib/navigation";
import { formatTime } from "../app/shared/lib/utils";

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
  const activeProgramName = activeProgram?.name ?? "Deleted program";

  const handleStart = (programId: string) => {
    const workoutId = sessionStore.getState().startWorkout(programId);
    if (!workoutId) return;
    uiStore.getState().setVtHero({ type: "program", id: programId });
    navigateWithTransition(router, `/workout?workoutId=${encodeURIComponent(workoutId)}`);
  };

  const handleResume = () => {
    if (!activeWorkout) return;
    uiStore.getState().setVtHero({ type: "program", id: activeWorkout.programId });
    navigateWithTransition(router, `/workout?workoutId=${encodeURIComponent(activeWorkout.id)}`);
  };

  return (
    <div className="page container">
      <HeaderBar title="Today" />

      {activeWorkout ? (
        <div className="resume-card">
          <button
            type="button"
            className={`ui-card card program-card ${
              vtHero?.type === "program" && activeProgram && vtHero.id === activeProgram.id ? "vt-hero" : ""
            }`}
            data-surface="1"
            onClick={handleResume}
          >
            <div className="ui-card__body card__body">
              <div className="program-card__header">
                <h3 className="ui-card__title card__title">Resume {activeProgramName}</h3>
                <span className="ui-badge badge badge--brand" data-variant="primary">
                  Active
                </span>
              </div>
              <p className="ui-card__meta card__meta">Started {formatTime(activeWorkout.startedAt)}</p>
            </div>
          </button>
        </div>
      ) : null}

      <section className="page__section">
        <h2 className="ui-section-title section-title">Programs</h2>
        <div className="stack virtual-list list-surface">
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
            <div className="ui-card card" data-surface="1">
              <div className="ui-card__body card__body">
                <p>No programs yet. Build one to get moving.</p>
                <button
                  type="button"
                  className="ui-button button button--primary"
                  data-variant="primary"
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
