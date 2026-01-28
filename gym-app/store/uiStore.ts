import { createStore } from "zustand/vanilla";
import type { Command } from "../commands/types";
import { startViewTransition } from "../lib/viewTransition";

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
  setVtHero: (hero: UiState["vtHero"]) => void;
  clearVtHero: () => void;
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
    setVtHero: (hero) => {
      set((state) => ({ ...state, vtHero: hero }), false, "ui/setVtHero");
      if (hero && typeof window !== "undefined") {
        window.setTimeout(() => {
          set((state) => ({ ...state, vtHero: null }), false, "ui/clearVtHero");
        }, 700);
      }
    },
    clearVtHero: () => set((state) => ({ ...state, vtHero: null }), false, "ui/clearVtHero"),
    openEditSet: (payload) => {
      startViewTransition(() => {
        sheetSession += 1;
        set(
          (state) => ({
            ...state,
            sheet: { type: "editSet", open: true, payload, sessionId: sheetSession },
          }),
          false,
          "ui/openEditSet"
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
          false,
          "ui/openConfirm"
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
          false,
          "ui/openSearchExercise"
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
          false,
          "ui/closeSheet"
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
        false,
        "ui/showSnackbar"
      );
      snackbarTimer = window.setTimeout(() => {
        set(
          (state) => ({
            ...state,
            snackbar: { ...state.snackbar, open: false },
          }),
          false,
          "ui/hideSnackbar"
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
        false,
        "ui/hideSnackbar"
      );
    },
  }));
