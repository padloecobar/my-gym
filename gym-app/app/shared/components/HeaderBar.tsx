"use client";

import { ReactNode } from "react";

export default function HeaderBar({ title, right, subtitle }: { title: string; right?: ReactNode; subtitle?: ReactNode }) {
  return (
    <header className="ui-header header-bar" data-surface="3">
      <div className="header-bar__text">
        <h1 className="ui-header__title header-bar__title page-title">{title}</h1>
        {subtitle ? <div className="ui-header__subtitle header-bar__subtitle muted">{subtitle}</div> : null}
      </div>
      {right ? <div className="header-bar__action">{right}</div> : null}
    </header>
  );
}
