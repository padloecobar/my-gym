"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import HydrationGate from "./HydrationGate";
import SheetHost from "./SheetHost";
import Snackbar from "./Snackbar";
import { registerServiceWorker } from "../lib/sw";
import { useMotionMode } from "../lib/useReducedMotion";
import { useUiShallow } from "../../../store/useUiStore";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const motionMode = useMotionMode();
  const [vtEnabled, setVtEnabled] = useState(false);
  const { motionStyle } = useUiShallow((s) => ({ motionStyle: s.motionStyle }));

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const enabled = typeof document !== "undefined" && "startViewTransition" in document && motionMode === "full";
    setVtEnabled(enabled);
  }, [motionMode]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      // Set motion style (fade/push/zoom) for view transition animations
      document.documentElement.dataset.motionStyle = motionStyle;
      // Set motion mode (reduced/full) for CSS gating per improve-1.md
      document.documentElement.dataset.motionMode = motionMode;
    }
  }, [motionStyle, motionMode]);

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
        data-motion-style={motionStyle}
      >
        <HydrationGate>{children}</HydrationGate>
      </main>
      <BottomNav />
      <SheetHost />
      <Snackbar />
    </div>
  );
}
