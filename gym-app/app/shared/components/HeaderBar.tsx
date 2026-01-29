"use client";

import { ReactNode } from "react";

export default function HeaderBar({ title, right, subtitle }: { title: string; right?: ReactNode; subtitle?: ReactNode }) {
  return (
    <header className="header-bar">
      <div className="header-bar__text">
        <h1 className="header-bar__title">{title}</h1>
        {subtitle ? <div className="header-bar__subtitle muted">{subtitle}</div> : null}
      </div>
      {right ? <div className="header-bar__action">{right}</div> : null}
    </header>
  );
}
