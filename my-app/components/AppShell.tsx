"use client";

import type { ReactNode } from "react";
import FileMirrorSync from "./FileMirrorSync";
import TabBar from "./TabBar";

type AppShellProps = {
  title: string;
  children: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
};

const AppShell = ({ title, children, headerLeft, headerRight }: AppShellProps) => {
  return (
    <div className="min-h-screen pb-24">
      <FileMirrorSync />
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:var(--bg-elev)]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3 text-sm text-[color:var(--muted)]">
            {headerLeft}
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-[color:var(--text)]">
            {title}
          </h1>
          <div className="flex items-center gap-2">{headerRight}</div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5">
        {children}
      </main>
      <TabBar />
    </div>
  );
};

export default AppShell;
