"use client";

import { useCommandExecutor } from "../../../commands/useCommandExecutor";
import { useUiShallow } from "../../../store/useUiStore";

export default function Snackbar() {
  const { snackbar, hideSnackbar } = useUiShallow((state) => ({
    snackbar: state.snackbar,
    hideSnackbar: state.hideSnackbar,
  }));
  const executeCommand = useCommandExecutor();

  if (!snackbar.open) return null;

  return (
    <div className="snackbar" role="status" aria-live="polite">
      <span>{snackbar.message}</span>
      {snackbar.actionLabel && snackbar.actionCommand ? (
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            if (snackbar.actionCommand) {
              executeCommand(snackbar.actionCommand);
            }
            hideSnackbar();
          }}
        >
          {snackbar.actionLabel}
        </button>
      ) : null}
    </div>
  );
}
