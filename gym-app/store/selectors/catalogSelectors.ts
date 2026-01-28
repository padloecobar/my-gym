import type { Exercise, Program } from "../../types/gym";
import type { CatalogState } from "../catalogStore";

export type CatalogMaps = {
  programById: Map<string, Program>;
  exerciseById: Map<string, Exercise>;
};

export const makeCatalogMapsSelector = () => {
  let lastPrograms: Program[] | undefined;
  let lastExercises: Exercise[] | undefined;
  let lastResult: CatalogMaps = {
    programById: new Map(),
    exerciseById: new Map(),
  };

  return (state: CatalogState): CatalogMaps => {
    if (state.programs === lastPrograms && state.exercises === lastExercises) {
      return lastResult;
    }

    lastPrograms = state.programs;
    lastExercises = state.exercises;
    lastResult = {
      programById: new Map(state.programs.map((program) => [program.id, program])),
      exerciseById: new Map(state.exercises.map((exercise) => [exercise.id, exercise])),
    };
    return lastResult;
  };
};
