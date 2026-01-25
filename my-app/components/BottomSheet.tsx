"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { IconClose } from "./Icons";

type BottomSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

const BottomSheet = ({ open, title, onClose, children, footer }: BottomSheetProps) => {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 transition ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 mx-auto w-full max-w-3xl transform transition-transform ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="rounded-t-[28px] border border-[var(--border)] bg-[color:var(--bg-card)] shadow-[var(--shadow)]">
          <div className="flex justify-center pt-3">
            <div className="h-1 w-12 rounded-full bg-[color:var(--border)]" />
          </div>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--text)] font-serif">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)] bg-[color:var(--chip)] text-[color:var(--text)]"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-5 pb-6 pt-4">
            {children}
          </div>
          {footer ? (
            <div className="sticky bottom-0 border-t border-[var(--border)] bg-[color:var(--bg-elev)] px-5 py-4 backdrop-blur">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
