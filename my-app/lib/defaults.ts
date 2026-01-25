import type { Exercise, SettingsState } from "./types";

export const DEFAULT_BAR_LB = 45;
export const DEFAULT_WEIGHT_PRESETS = [25, 35, 45, 55, 65, 75, 85, 95];
export const DEFAULT_REP_PRESETS = [3, 5, 8, 10, 12, 15];
export const DEFAULT_TAGS = ["easy", "pause", "slow"];

export const defaultSettings: SettingsState = {
  barLb: DEFAULT_BAR_LB,
  unitDisplay: "both",
  roundingKg: 0.1,
  e1rmFormula: "epley",
  weightPresets: DEFAULT_WEIGHT_PRESETS,
  repPresets: DEFAULT_REP_PRESETS,
  lastWorkout: undefined,
  onboarded: false,
};

export const createDefaultExercises = (): Exercise[] => {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      name: "Squat",
      type: "barbell",
      workout: "A",
      order: 0,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "Bench Press",
      type: "barbell",
      workout: "A",
      order: 1,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "Lat Pulldown",
      type: "machine",
      workout: "A",
      order: 2,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "Deadlift",
      type: "barbell",
      workout: "B",
      order: 0,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "Overhead Press",
      type: "barbell",
      workout: "B",
      order: 1,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: "Row",
      type: "barbell",
      workout: "B",
      order: 2,
      createdAt: now,
    },
  ];
};
