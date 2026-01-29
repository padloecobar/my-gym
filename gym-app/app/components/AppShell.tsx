"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import HydrationGate from "./HydrationGate";
import SheetHost from "./SheetHost";
import Snackbar from "./Snackbar";
import { registerServiceWorker } from "../../lib/sw";
import { useReducedMotion } from "../../lib/useReducedMotion";
import { useUiShallow } from "../../store/useUiStore";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [vtEnabled, setVtEnabled] = useState(false);
  const { motionStyle } = useUiShallow((s) => ({ motionStyle: s.motionStyle }));

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const enabled = typeof document !== "undefined" && "startViewTransition" in document && !reduceMotion;
    setVtEnabled(enabled);
  }, [reduceMotion]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.motion = motionStyle;
    }
  }, [motionStyle]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.vt = vtEnabled ? "true" : "false";
    }
  }, [vtEnabled]);

  return (
    <div className="app-shell">
      <main
        className="app-main route-view"
        data-anim="enter"
        data-vt={vtEnabled ? "true" : "false"}
        data-motion={motionStyle}
        key={pathname}
      >
        <HydrationGate>{children}</HydrationGate>
      </main>
      <BottomNav />
      <SheetHost />
      <Snackbar />
    </div>
  );
}
