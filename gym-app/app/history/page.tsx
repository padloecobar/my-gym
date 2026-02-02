"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import HeaderBar from "../shared/components/HeaderBar";
import BackButton from "../shared/components/BackButton";
import VtLink from "../shared/components/VtLink";
import { useCatalogShallow } from "../../store/useCatalogStore";
import { useSessionShallow, useSessionStore } from "../../store/useSessionStore";
import { useUiShallow } from "../../store/useUiStore";
import type { SetEntry, Workout, WorkoutEntry } from "../../types/gym";
import { formatDate, formatKg, formatLb, formatTime, formatWeight } from "../../app/shared/lib/utils";
import { getWorkoutStats, makeWorkoutViewSelector } from "../../store/selectors/sessionSelectors";

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const workoutId = searchParams.get("workoutId") ?? undefined;
  const showDetail = Boolean(workoutId);

  const { programs, exercises } = useCatalogShallow((state) => ({
    programs: state.programs,
    exercises: state.exercises,
  }));
  const { setVtHero, vtHero } = useUiShallow((state) => ({
    setVtHero: state.setVtHero,
    vtHero: state.vtHero,
  }));
  const { workoutIds, workoutsById, entriesById, entryIdsByWorkoutId, setIdsByEntryId, setsById } =
    useSessionShallow((state) => ({
      workoutIds: state.workoutIds,
      workoutsById: state.workoutsById,
      entriesById: state.entriesById,
      entryIdsByWorkoutId: state.entryIdsByWorkoutId,
      setIdsByEntryId: state.setIdsByEntryId,
      setsById: state.setsById,
    }));

  const workoutSelector = useMemo(() => (workoutId ? makeWorkoutViewSelector(workoutId) : () => null), [
    workoutId,
  ]);
  const workout = useSessionStore(workoutSelector);

  const completed = useMemo<Workout[]>(() => {
    if (showDetail) return [];
    return workoutIds
      .map((workoutKey) => {
        const workout = workoutsById[workoutKey];
        if (!workout || !workout.endedAt) return null;
        const entryIds = entryIdsByWorkoutId[workoutKey] ?? [];
        const entries = entryIds
          .map((entryId) => {
            const entry = entriesById[entryId];
            if (!entry) return null;
            const setIds = setIdsByEntryId[entryId] ?? [];
            const sets = setIds
              .map((setId) => setsById[setId])
              .filter((set): set is SetEntry => Boolean(set));
            return { exerciseId: entry.exerciseId, suggested: entry.suggested, sets };
          })
          .filter((entry): entry is WorkoutEntry => Boolean(entry));
        return { ...workout, entries };
      })
      .filter((workout): workout is Workout => Boolean(workout));
  }, [showDetail, workoutIds, workoutsById, entryIdsByWorkoutId, entriesById, setIdsByEntryId, setsById]);

  const grouped = useMemo(() => {
    if (showDetail) return {} as Record<string, Workout[]>;
    return completed.reduce<Record<string, Workout[]>>((acc, workout) => {
      const dateKey = new Date(workout.endedAt ?? workout.startedAt).toDateString();
      acc[dateKey] = acc[dateKey] ? [...acc[dateKey], workout] : [workout];
      return acc;
    }, {});
  }, [completed, showDetail]);

  const programById = useMemo(() => new Map(programs.map((program) => [program.id, program])), [programs]);

  const volumeByWorkoutId = useMemo(() => {
    if (showDetail) return new Map<string, number>();
    return new Map(completed.map((workout) => [workout.id, getWorkoutStats(workout).totalVolume]));
  }, [completed, showDetail]);

  const detailProgramName = useMemo(() => {
    if (!workout) return "";
    return programById.get(workout.programId)?.name ?? "Deleted program";
  }, [programById, workout]);

  const detailVolume = useMemo(() => {
    if (!workout) return 0;
    return getWorkoutStats(workout).totalVolume;
  }, [workout]);

  return (
    <div className="page container">
      <HeaderBar title="History" />

      {showDetail ? (
        <>
          <BackButton />

          {!workout ? (
            <p>Workout not found.</p>
          ) : (
            <>
              <div className={`card ${vtHero?.type === "history" && vtHero.id === workout.id ? "vt-hero" : ""}`}>
                <div className="card__body">
                  <h2 className="card__title">{detailProgramName}</h2>
                  <p className="card__meta">
                    {formatDate(workout.endedAt ?? workout.startedAt)} -{" "}
                    {formatTime(workout.endedAt ?? workout.startedAt)}
                  </p>
                  <div className="cluster">
                    <span className="badge">{formatWeight(detailVolume)}</span>
                  </div>
                </div>
              </div>

              <section className="stack">
                {workout.entries.map((entry) => {
                  const exercise = exercises.find((item) => item.id === entry.exerciseId);
                  if (!exercise) return null;
                  return (
                    <div key={entry.exerciseId} className="card">
                      <div className="card__body">
                        <div className="cluster cluster--between">
                          <h3 className="card__title">{exercise.name}</h3>
                          <span className="badge">{exercise.type}</span>
                        </div>
                        <div className="stack">
                          {entry.sets.map((set) => (
                            <div key={set.id} className="set-row set-row--static">
                              <div>
                                <div className="set-row__kg">{formatKg(set.weightKg)} kg</div>
                                <div className="set-row__lb muted">{formatLb(set.weightKg)} lb</div>
                              </div>
                              <div className="set-row__reps">
                                <span className="set-row__reps-value">{set.reps}</span>
                                <span className="set-row__reps-label muted">reps</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            </>
          )}
        </>
      ) : (
        <div className="stack virtual-list">
          {Object.entries(grouped).map(([dateKey, items]) => (
            <section key={dateKey} className="page__section">
              <h2 className="card__title">{formatDate(new Date(dateKey).getTime())}</h2>
              <div className="stack">
                {items.map((workout) => {
                  const program = programById.get(workout.programId);
                  const volume = volumeByWorkoutId.get(workout.id) ?? 0;
                  return (
                    <VtLink
                      key={workout.id}
                      href={`/history?workoutId=${encodeURIComponent(workout.id)}`}
                      className={`card program-card ${
                        vtHero?.type === "history" && vtHero.id === workout.id ? "vt-hero" : ""
                      }`}
                      onClick={() => setVtHero({ type: "history", id: workout.id })}
                    >
                      <div className="card__body">
                        <div className="program-card__header">
                          <h3 className="card__title">{program?.name ?? "Workout"}</h3>
                          <span className="badge">{formatWeight(volume)}</span>
                        </div>
                        <p className="card__meta">{formatDate(workout.endedAt ?? workout.startedAt)}</p>
                      </div>
                    </VtLink>
                  );
                })}
              </div>
            </section>
          ))}
          {completed.length === 0 ? <p className="muted">No workouts yet.</p> : null}
        </div>
      )}
    </div>
  );
}
