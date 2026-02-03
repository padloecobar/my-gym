"use client";

import type { Program } from "../../../../types/gym";
import VtLink from "../../../shared/components/VtLink";

type ProgramCardProps = {
  program: Program;
  meta?: string;
  href?: string;
  onClick?: () => void;
  hero?: boolean;
  actionLabel?: string;
};

export default function ProgramCard({ program, meta, href, onClick, hero, actionLabel }: ProgramCardProps) {
  const content = (
    <div className="ui-card__body card__body">
      <div className="program-card__header">
        <h3 className="ui-card__title card__title truncate">{program.name}</h3>
        {actionLabel ? (
          <span className="ui-badge badge badge--brand" data-variant="primary">
            {actionLabel}
          </span>
        ) : null}
      </div>
      {meta ? <p className="ui-card__meta card__meta">{meta}</p> : null}
      {program.note ? <p className="program-card__note muted">{program.note}</p> : null}
    </div>
  );

  const className = `ui-card card program-card${hero ? " vt-hero" : ""}`;

  if (href) {
    return (
      <VtLink href={href} className={className} data-surface="1">
        {content}
      </VtLink>
    );
  }

  return (
    <button type="button" className={className} data-surface="1" onClick={onClick}>
      {content}
    </button>
  );
}
