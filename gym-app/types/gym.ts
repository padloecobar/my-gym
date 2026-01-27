export type ExerciseType = "Barbell" | "Dumbbell" | "Machine" | "Bodyweight" | "Cable";
export type InputMode = "total" | "plates";

export type Exercise = {
  id: string;
  name: string;
  type: ExerciseType;
  defaultInputMode: InputMode;
};

export type Program = {
  id: string;
  name: string;
  note?: string;
  exerciseIds: string[];
};

export type SetEntry = {
  id: string;
  weightKg: number;
  reps: number;
  completed: boolean;
  mode: InputMode;
};

export type WorkoutEntry = {
  exerciseId: string;
  sets: SetEntry[];
  suggested: boolean;
};

export type Workout = {
  id: string;
  programId: string;
  startedAt: number;
  endedAt?: number;
  entries: WorkoutEntry[];
};

export type Settings = {
  unitsPreference: "kg" | "lb";
  defaultBarWeight: number;
};

export type GymExport = {
  programs: Program[];
  exercises: Exercise[];
  workouts: Workout[];
  settings: Settings;
};
