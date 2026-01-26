import { useState, type ReactNode } from "react";

type ToastProps = {
  message: ReactNode;
  actionLabel?: string;
  onAction?: () => Promise<void> | void;
  onClose?: () => void;
};

const Toast = ({ message, actionLabel, onAction, onClose }: ToastProps) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!onAction) return;
    try {
      const res = onAction();
      const isThenable =
        typeof res === "object" &&
        res !== null &&
        "then" in res &&
        typeof (res as PromiseLike<unknown>).then === "function";
      if (isThenable) {
        setLoading(true);
        await res;
      }
    } catch (err) {
      console.error("Toast action error:", err);
    } finally {
      setLoading(false);
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 mx-auto flex w-[calc(100%-2.5rem)] max-w-md items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-card)] px-4 py-3 text-sm text-[color:var(--text)] shadow-[var(--shadow)]">
      <div className="flex-1 text-sm text-[color:var(--text)]">{message}</div>
      {actionLabel ? (
        <button
          type="button"
          onClick={handleAction}
          disabled={loading}
          className="min-h-[44px] rounded-full bg-[color:var(--accent)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-ink)] disabled:opacity-60"
        >
          {actionLabel}
        </button>
      ) : null}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-2 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]"
        >
          Close
        </button>
      ) : null}
    </div>
  );
};

export default Toast;
