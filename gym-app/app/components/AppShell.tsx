"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import HydrationGate from "./HydrationGate";
import SheetHost from "./SheetHost";
import Snackbar from "./Snackbar";
import { registerServiceWorker } from "../../lib/sw";
import { useReducedMotion } from "../../lib/useReducedMotion";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [vtEnabled, setVtEnabled] = useState(false);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const enabled = typeof document !== "undefined" && "startViewTransition" in document && !reduceMotion;
    setVtEnabled(enabled);
  }, [reduceMotion]);

  return (
    <div className="app-shell">
      <main
        className="app-main route-view"
        data-anim="enter"
        data-vt={vtEnabled ? "true" : "false"}
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
