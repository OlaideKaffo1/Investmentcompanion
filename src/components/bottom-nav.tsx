"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const TABS = [
  { href: "/", label: "Today", icon: TodayIcon },
  { href: "/companies", label: "Companies", icon: CompaniesIcon },
] as const;

// The current page is only known per request, so the bar first renders with
// no tab highlighted and fills in the highlight straight after.
export function BottomNav() {
  return (
    <Suspense fallback={<Bar pathname={null} />}>
      <ActiveBar />
    </Suspense>
  );
}

function ActiveBar() {
  return <Bar pathname={usePathname()} />;
}

function Bar({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 border-t border-hairline bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex h-16 max-w-xl">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : !!pathname?.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-eyebrow transition-colors ${
                  active ? "text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                <Icon />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Thin monoline icons, drawn in the current text colour.
function TodayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="1.5" />
      <path d="M4 9.5h16M8.5 3v4M15.5 3v4" strokeLinecap="round" />
    </svg>
  );
}

function CompaniesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 19h16" strokeLinecap="round" />
      <path d="M6.5 19v-6M11 19V8M15.5 19v-4M20 19V5" strokeLinecap="round" />
    </svg>
  );
}
