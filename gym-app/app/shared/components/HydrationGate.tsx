"use client";

import type { ReactNode } from "react";
import { useCatalogStore } from "../../../store/useCatalogStore";
import { useSessionStore } from "../../../store/useSessionStore";
import { useSettingsStore } from "../../../store/useSettingsStore";

type HydrationGateProps = {
  children: ReactNode;
};

export default function HydrationGate({ children }: HydrationGateProps) {
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);
  const catalogHydrated = useCatalogStore((state) => state.hasHydrated);
  const sessionHydrated = useSessionStore((state) => state.hasHydrated);
  const isHydrated = settingsHydrated && catalogHydrated && sessionHydrated;

  if (!isHydrated) {
    return (
      <div className="page container">
        <div className="ui-card card" data-surface="1">
          <div className="ui-card__body card__body">
            <p className="muted">Loading your gym data...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
