"use client";

import FileMirrorSync from "./FileMirrorSync";
import TabBar from "./TabBar";

import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  children: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  header?: ReactNode;
  mainClassName?: string;
};

const AppShell = ({
  title,
  children,
  headerLeft,
  headerRight,
  header,
  mainClassName,
}: AppShellProps) => {
  return (
    <div className="min-h-screen pb-28">
      <FileMirrorSync />
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:var(--bg-elev)] backdrop-blur-xl">
        <div className="mx-auto w-full max-w-3xl">
          {header ?? (
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex min-w-[72px] items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                {headerLeft}
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--muted)]">
                  Gym Log
                </div>
                <h1 className="mt-1 text-base font-semibold uppercase tracking-[0.2em] text-[color:var(--text)] font-serif">
                  {title}
                </h1>
              </div>
              <div className="flex min-w-[72px] items-center justify-end gap-2">
                {headerRight}
              </div>
            </div>
          )}
        </div>
      </header>
      <main
        className={`mx-auto w-full max-w-3xl px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 ${
          mainClassName ?? ""
        }`}
      >
        {children}
      </main>
      <TabBar />
    </div>
  );
};

export default AppShell;
