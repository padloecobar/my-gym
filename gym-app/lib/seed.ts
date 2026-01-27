import type { Exercise, Program, Settings } from "../types/gym";
import { createId } from "./utils";

export const defaultSettings: Settings = {
  unitsPreference: "kg",
  defaultBarWeight: 20,
};

export const seedExercises = (): Exercise[] => {
  return [
    { id: createId(), name: "Back Squat", type: "Barbell", defaultInputMode: "plates" },
    { id: createId(), name: "Bench Press", type: "Barbell", defaultInputMode: "plates" },
    { id: createId(), name: "Deadlift", type: "Barbell", defaultInputMode: "plates" },
    { id: createId(), name: "Lat Pulldown", type: "Machine", defaultInputMode: "total" },
    { id: createId(), name: "Incline Dumbbell Press", type: "Dumbbell", defaultInputMode: "total" },
    { id: createId(), name: "Bulgarian Split Squat", type: "Bodyweight", defaultInputMode: "total" },
  ];
};

export const seedPrograms = (exerciseIds: string[]): Program[] => {
  const [squat, bench, deadlift, lat, incline, split] = exerciseIds;
  return [
    {
      id: createId(),
      name: "Strength A",
      note: "Heavy compounds + back work",
      exerciseIds: [squat, bench, lat],
    },
    {
      id: createId(),
      name: "Strength B",
      note: "Posterior chain focus",
      exerciseIds: [deadlift, incline, split],
    },
  ];
};
