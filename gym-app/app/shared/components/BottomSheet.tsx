"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useReducedMotion } from "../lib/useReducedMotion";

const getFocusable = (element: HTMLElement | null) => {
  if (!element) return [] as HTMLElement[];
  return Array.from(
    element.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    )
  ).filter((node) => !node.hasAttribute("disabled"));
};

export default function BottomSheet({
  open,
  title,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const focusable = getFocusable(panelRef.current);
    focusable[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const nodes = getFocusable(panelRef.current);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.dataset.sheetOpen = "true";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.dataset.sheetOpen = "false";
    };
  }, [open, onClose]);

  return (
    <div
      className="ui-sheet sheet"
      data-open={open ? "true" : "false"}
      data-reduce-motion={reduceMotion}
      aria-hidden={open ? "false" : "true"}
      inert={!open}
    >
      <button type="button" className="ui-sheet__backdrop sheet__backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="ui-sheet__panel sheet__panel"
        data-surface="3"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        ref={panelRef}
        onFocusCapture={(event) => {
          const target = event.target as HTMLElement;
          if (target && target.scrollIntoView) {
            target.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
          }
        }}
      >
        <div className="ui-sheet__header sheet__header">
          <h2 id="sheet-title" className="ui-sheet__title sheet__title">
            {title}
          </h2>
          <button
            type="button"
            className="ui-button button button--ghost button--sm"
            data-variant="ghost"
            data-size="sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="ui-sheet__content sheet__content">{children}</div>
        {footer ? <div className="ui-sheet__footer sheet__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
