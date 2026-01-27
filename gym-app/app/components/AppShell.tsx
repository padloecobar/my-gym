"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import SheetHost from "./SheetHost";
import Snackbar from "./Snackbar";
import { useGymStore } from "../../store/gym";
import { registerServiceWorker } from "../../lib/sw";
import { useReducedMotion } from "../../lib/useReducedMotion";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const init = useGymStore((state) => state.init);

  const vtEnabled = useMemo(() => {
    if (typeof document === "undefined") return false;
    return "startViewTransition" in document && !reduceMotion;
  }, [reduceMotion]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <div className="app-shell">
      <main
        className="app-main route-view"
        data-anim="enter"
        data-vt={vtEnabled ? "true" : "false"}
        key={pathname}
      >
        {children}
      </main>
      <BottomNav />
      <SheetHost />
      <Snackbar />
    </div>
  );
}
