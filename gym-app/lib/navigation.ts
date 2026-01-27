import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { startViewTransition } from "./viewTransition";

export const navigateWithTransition = (router: AppRouterInstance, href: string) => {
  startViewTransition(() => router.push(href));
};
