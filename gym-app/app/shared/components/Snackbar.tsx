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
    <div className="ui-snackbar snackbar" role="status" aria-live="polite" data-surface="3">
      <span>{snackbar.message}</span>
      {snackbar.actionLabel && snackbar.actionCommand ? (
        <button
          type="button"
          className="ui-button button button--ghost button--sm"
          data-variant="ghost"
          data-size="sm"
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
