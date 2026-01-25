export type ExerciseType = "barbell" | "dumbbell" | "machine" | "bodyweight";
export type WorkoutId = "A" | "B" | "Custom";
export type UnitDisplay = "both" | "lb" | "kg";
export type E1RMFormula = "epley" | "brzycki";

export type Exercise = {
  id: string;
  name: string;
  type: ExerciseType;
  workout: WorkoutId;
  perSide?: boolean;
  order: number;
  createdAt: number;
};

export type SetEntry = {
  id: string;
  ts: number;
  date: string;
  exerciseId: string;
  reps: number;
  inputLb: number;
  barLbSnapshot: number;
  totalLb: number;
  totalKg: number;
  note?: string;
  tags?: string[];
  meta?: {
    rpe?: number;
  };
};

export type SettingsState = {
  barLb: number;
  unitDisplay: UnitDisplay;
  roundingKg: number;
  e1rmFormula: E1RMFormula;
  weightPresets: number[];
  repPresets: number[];
  lastWorkout?: WorkoutId;
  onboarded?: boolean;
};

export type BackupPayload = {
  version: number;
  exportedAt: number;
  exercises: Exercise[];
  sets: SetEntry[];
  settings: SettingsState;
};
