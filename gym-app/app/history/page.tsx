"use client";

import HeaderBar from "../shared/components/HeaderBar";
import VtLink from "../shared/components/VtLink";
import { useMemo } from "react";
import { useCatalogShallow } from "../../store/useCatalogStore";
import { useSessionShallow } from "../../store/useSessionStore";
import { useUiShallow } from "../../store/useUiStore";
import type { SetEntry, Workout, WorkoutEntry } from "../../types/gym";
import { formatDate, formatWeight } from "../../app/shared/lib/utils";
import { getWorkoutStats } from "../../store/selectors/sessionSelectors";

export default function HistoryPage() {
  const { programs } = useCatalogShallow((state) => ({ programs: state.programs }));
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

  const completed = useMemo<Workout[]>(() => {
    return workoutIds
      .map((workoutId) => {
        const workout = workoutsById[workoutId];
        if (!workout || !workout.endedAt) return null;
        const entryIds = entryIdsByWorkoutId[workoutId] ?? [];
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
  }, [workoutIds, workoutsById, entryIdsByWorkoutId, entriesById, setIdsByEntryId, setsById]);

  const grouped = useMemo(() => {
    return completed.reduce<Record<string, Workout[]>>((acc, workout) => {
      const dateKey = new Date(workout.endedAt ?? workout.startedAt).toDateString();
      acc[dateKey] = acc[dateKey] ? [...acc[dateKey], workout] : [workout];
      return acc;
    }, {});
  }, [completed]);

  const programById = useMemo(() => new Map(programs.map((program) => [program.id, program])), [programs]);

  const volumeByWorkoutId = useMemo(() => {
    return new Map(completed.map((workout) => [workout.id, getWorkoutStats(workout).totalVolume]));
  }, [completed]);

  return (
    <div className="page container">
      <HeaderBar title="History" />

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
                    href={`/history/${workout.id}`}
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
    </div>
  );
}
