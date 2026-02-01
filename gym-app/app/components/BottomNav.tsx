"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import VtLink from "../shared/components/VtLink";
import { CalendarIcon } from "../shared/components/icons/CalendarIcon";
import { BookIcon } from "../shared/components/icons/BookIcon";
import { ClockIcon } from "../shared/components/icons/ClockIcon";
import { GearIcon } from "../shared/components/icons/GearIcon";

const items: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/", label: "Today", icon: <CalendarIcon className="bottom-nav__icon" /> },
  { href: "/programs", label: "Programs", icon: <BookIcon className="bottom-nav__icon" /> },
  { href: "/history", label: "History", icon: <ClockIcon className="bottom-nav__icon" /> },
  { href: "/settings", label: "Settings", icon: <GearIcon className="bottom-nav__icon" /> },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <VtLink
            key={item.href}
            href={item.href}
            className="bottom-nav__item"
            ariaCurrent={isActive ? "page" : "false"}
          >
            {item.icon}
            <span className="bottom-nav__label">{item.label}</span>
          </VtLink>
        );
      })}
    </nav>
  );
}
