import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { startViewTransition } from "./viewTransition";

export const navigateWithTransition = (router: AppRouterInstance, href: string) => {
  if (typeof document !== "undefined") {
    // Clean up any existing nav attribute first to ensure correct direction
    document.documentElement.removeAttribute("data-nav");
    // Force reflow to ensure cleanup is applied
    void document.documentElement.offsetHeight;
    document.documentElement.dataset.nav = "forward";
  }
  const maybeT = startViewTransition(() => router.push(href));
  // Clear data-nav after transition finishes
  if (typeof document !== "undefined") {
    try {
      const finished = (maybeT as any)?.finished;
      if (finished instanceof Promise) {
        finished.finally(() => {
          document.documentElement.removeAttribute("data-nav");
        });
      } else {
        queueMicrotask(() => document.documentElement.removeAttribute("data-nav"));
      }
    } catch {
      document.documentElement.removeAttribute("data-nav");
    }
  }
};

export const backWithTransition = (router: AppRouterInstance) => {
  if (typeof document !== "undefined") {
    // Clean up any existing nav attribute first to ensure correct direction
    document.documentElement.removeAttribute("data-nav");
    // Force reflow to ensure cleanup is applied
    void document.documentElement.offsetHeight;
    document.documentElement.dataset.nav = "back";
  }
  const maybeT = startViewTransition(() => router.back());
  // Clear data-nav after transition finishes
  if (typeof document !== "undefined") {
    try {
      const finished = (maybeT as any)?.finished;
      if (finished instanceof Promise) {
        finished.finally(() => {
          document.documentElement.removeAttribute("data-nav");
        });
      } else {
        queueMicrotask(() => document.documentElement.removeAttribute("data-nav"));
      }
    } catch {
      document.documentElement.removeAttribute("data-nav");
    }
  }
};
