import type { UndoDeleteSetPayload } from "../types/session";

export type Command =
  | { type: "FINISH_WORKOUT"; payload: { workoutId: string; navigateTo?: string } }
  | { type: "DELETE_PROGRAM"; payload: { programId: string; navigateTo?: string } }
  | { type: "RESET_ALL" }
  | { type: "UNDO_DELETE_SET"; payload: UndoDeleteSetPayload };
