import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { startViewTransition } from "./viewTransition";

export const navigateWithTransition = (router: AppRouterInstance, href: string) => {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.nav = "forward";
  }
  const maybeT = startViewTransition(() => router.push(href));
  // Clear data-nav after transition finishes (preferred) or use microtask fallback
  if (typeof document !== "undefined") {
    try {
      const finished = (maybeT as any)?.finished;
      if (finished instanceof Promise) {
        finished.finally(() => document.documentElement.removeAttribute("data-nav"));
      } else {
        // Microtask fallback: schedule removal after the current tick
        queueMicrotask(() => document.documentElement.removeAttribute("data-nav"));
      }
    } catch {
      document.documentElement.removeAttribute("data-nav");
    }
  }
};

export const backWithTransition = (router: AppRouterInstance) => {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.nav = "back";
  }
  const maybeT = startViewTransition(() => router.back());
  // Clear data-nav after transition finishes (preferred) or use microtask fallback
  if (typeof document !== "undefined") {
    try {
      const finished = (maybeT as any)?.finished;
      if (finished instanceof Promise) {
        finished.finally(() => document.documentElement.removeAttribute("data-nav"));
      } else {
        queueMicrotask(() => document.documentElement.removeAttribute("data-nav"));
      }
    } catch {
      document.documentElement.removeAttribute("data-nav");
    }
  }
};
