"use client";

import Link, { LinkProps } from "next/link";
import { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "../../lib/useReducedMotion";

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

    const navigate = () => router.push(href.toString());
    if (!reduceMotion && typeof document !== "undefined" && "startViewTransition" in document) {
      (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(
        navigate
      );
    } else {
      navigate();
    }
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
