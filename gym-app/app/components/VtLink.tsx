"use client";

import Link, { LinkProps } from "next/link";
import { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "../../lib/useReducedMotion";
import { navigateWithTransition } from "../../lib/navigation";

type VtLinkProps = LinkProps & {
  className?: string;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  ariaCurrent?: "page" | "true" | "false";
};

export default function VtLink({ href, className, children, onClick, ariaCurrent, ...rest }: VtLinkProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    onClick?.(event);

    // Use centralized navigation helper which applies data-nav and transitions
    navigateWithTransition(router, href.toString());
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      aria-current={ariaCurrent}
      {...rest}
    >
      {children}
    </Link>
  );
}
