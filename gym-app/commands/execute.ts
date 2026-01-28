import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { Command } from "./types";
import { navigateWithTransition } from "../lib/navigation";
import { startViewTransition } from "../lib/viewTransition";
import type { CatalogStore, SessionStore, SettingsStore, UiStore } from "../store/AppStoreProvider";
import { createAppActions } from "../store/appActions";

export type CommandContext = {
  settingsStore: SettingsStore;
  catalogStore: CatalogStore;
  sessionStore: SessionStore;
  uiStore: UiStore;
  router?: AppRouterInstance;
};

export const executeCommand = async (command: Command, context: CommandContext) => {
  switch (command.type) {
    case "FINISH_WORKOUT": {
      context.sessionStore.getState().finishWorkout(command.payload.workoutId);
      if (command.payload.navigateTo && context.router) {
        navigateWithTransition(context.router, command.payload.navigateTo);
      }
      return;
    }
    case "DELETE_PROGRAM": {
      const { programId, navigateTo } = command.payload;
      if (navigateTo && context.router) {
        startViewTransition(() => {
          context.catalogStore.getState().deleteProgram(programId);
          context.router?.push(navigateTo);
        });
        return;
      }
      startViewTransition(() => {
        context.catalogStore.getState().deleteProgram(programId);
      });
      return;
    }
    case "RESET_ALL": {
      const actions = createAppActions(context);
      await actions.resetAll();
      return;
    }
    case "UNDO_DELETE_SET": {
      context.sessionStore.getState().restoreDeletedSet(command.payload);
      return;
    }
    default: {
      return;
    }
  }
};
