"use client";

import { useGymStore } from "../../store/gym";

export default function Snackbar() {
  const snackbar = useGymStore((state) => state.ui.snackbar);
  const hide = useGymStore((state) => state.hideSnackbar);

  if (!snackbar.open) return null;

  return (
    <div className="snackbar" role="status" aria-live="polite">
      <span>{snackbar.message}</span>
      {snackbar.actionLabel ? (
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            snackbar.onAction?.();
            hide();
          }}
        >
          {snackbar.actionLabel}
        </button>
      ) : null}
    </div>
  );
}
