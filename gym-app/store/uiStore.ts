import { createStore } from "zustand/vanilla";
import type { Command } from "../commands/types";
import { startViewTransition } from "../lib/viewTransition";

export type MotionStyle = "fade" | "push" | "zoom";

export type ConfirmPayload = {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "default" | "danger";
  command: Command;
};

export type EditSetPayload = {
  workoutId: string;
  exerciseId: string;
  setId: string;
};

export type SearchExercisePayload = {
  programId: string;
};

type SheetState =
  | { type: null; open: false }
  | { type: "editSet"; open: boolean; payload: EditSetPayload; sessionId: number }
  | { type: "confirm"; open: boolean; payload: ConfirmPayload; sessionId: number }
  | { type: "searchExercise"; open: boolean; payload: SearchExercisePayload; sessionId: number };

type SnackbarState = {
  open: boolean;
  message: string;
  actionLabel?: string;
  actionCommand?: Command;
};

export type UiState = {
  sheet: SheetState;
  snackbar: SnackbarState;
  vtHero: { type: "program" | "history"; id: string } | null;
  motionStyle: MotionStyle;
  setVtHero: (hero: UiState["vtHero"]) => void;
  clearVtHero: () => void;
  setMotionStyle: (style: MotionStyle) => void;
  openEditSet: (payload: EditSetPayload) => void;
  openConfirm: (payload: ConfirmPayload) => void;
  openSearchExercise: (payload: SearchExercisePayload) => void;
  closeSheet: () => void;
  showSnackbar: (message: string, actionLabel?: string, actionCommand?: Command) => void;
  hideSnackbar: () => void;
};

let snackbarTimer: number | undefined;
let sheetSession = 0;

export const createUiStore = () =>
  createStore<UiState>((set, get) => ({
    sheet: { type: null, open: false },
    snackbar: { open: false, message: "" },
    vtHero: null,
    motionStyle: "fade",
    setVtHero: (hero) => {
      set((state) => ({ ...state, vtHero: hero }), false);
      if (hero && typeof window !== "undefined") {
        window.setTimeout(() => {
          set((state) => ({ ...state, vtHero: null }), false);
        }, 700);
      }
    },
    clearVtHero: () => set((state) => ({ ...state, vtHero: null }), false),
    setMotionStyle: (style) => set((state) => ({ ...state, motionStyle: style }), false),
    openEditSet: (payload) => {
      startViewTransition(() => {
        sheetSession += 1;
        set(
          (state) => ({
            ...state,
            sheet: { type: "editSet", open: true, payload, sessionId: sheetSession },
          }),
          false
        );
      });
    },
    openConfirm: (payload) => {
      startViewTransition(() => {
        sheetSession += 1;
        set(
          (state) => ({
            ...state,
            sheet: { type: "confirm", open: true, payload, sessionId: sheetSession },
          }),
          false
        );
      });
    },
    openSearchExercise: (payload) => {
      startViewTransition(() => {
        sheetSession += 1;
        set(
          (state) => ({
            ...state,
            sheet: { type: "searchExercise", open: true, payload, sessionId: sheetSession },
          }),
          false
        );
      });
    },
    closeSheet: () => {
      startViewTransition(() => {
        set(
          (state) => {
            if (state.sheet.type === null) return state;
            return { ...state, sheet: { ...state.sheet, open: false } };
          },
          false
        );
      });
    },
    showSnackbar: (message, actionLabel, actionCommand) => {
      if (typeof window === "undefined") return;
      if (snackbarTimer) {
        window.clearTimeout(snackbarTimer);
      }
      set(
        (state) => ({
          ...state,
          snackbar: {
            open: true,
            message,
            actionLabel,
            actionCommand,
          },
        }),
        false
      );
      snackbarTimer = window.setTimeout(() => {
        set(
          (state) => ({
            ...state,
            snackbar: { ...state.snackbar, open: false },
          }),
          false
        );
      }, 4200);
    },
    hideSnackbar: () => {
      if (typeof window === "undefined") return;
      if (snackbarTimer) {
        window.clearTimeout(snackbarTimer);
      }
      set(
        (state) => ({
          ...state,
          snackbar: { ...state.snackbar, open: false },
        }),
        false
      );
    },
  }));
