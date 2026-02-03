"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import VtLink from "../shared/components/VtLink";
import { CalendarIcon } from "../shared/components/icons/CalendarIcon";
import { BookIcon } from "../shared/components/icons/BookIcon";
import { ClockIcon } from "../shared/components/icons/ClockIcon";
import { GearIcon } from "../shared/components/icons/GearIcon";

const items: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/", label: "Today", icon: <CalendarIcon className="ui-nav__icon bottom-nav__icon" /> },
  { href: "/programs", label: "Programs", icon: <BookIcon className="ui-nav__icon bottom-nav__icon" /> },
  { href: "/history", label: "History", icon: <ClockIcon className="ui-nav__icon bottom-nav__icon" /> },
  { href: "/settings", label: "Settings", icon: <GearIcon className="ui-nav__icon bottom-nav__icon" /> },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="ui-nav bottom-nav" aria-label="Primary" data-surface="3">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <VtLink
            key={item.href}
            href={item.href}
            className="ui-nav__item bottom-nav__item"
            ariaCurrent={isActive ? "page" : "false"}
            data-state={isActive ? "active" : "default"}
          >
            {item.icon}
            <span className="ui-nav__label bottom-nav__label">{item.label}</span>
          </VtLink>
        );
      })}
    </nav>
  );
}
