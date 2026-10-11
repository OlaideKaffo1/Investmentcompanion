import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCompanies } from "@/lib/companies";
import { shortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Archive" };

// Companies you stopped following. Their history stays; open one to follow
// it again or delete it for good.
export default function ArchivePage() {
  return (
    <div className="flex flex-col gap-8 pt-8">
      <div className="flex flex-col gap-3">
        <Link href="/companies" className="btn-ghost self-start">
          ← Companies
        </Link>
        <h1 className="text-heading-lg">Archive</h1>
        <p className="text-body-sm text-ink-muted">
          Companies you stopped following, with their history kept. They don&apos;t count toward
          your twenty.
        </p>
      </div>
      <Suspense fallback={<div className="h-32 animate-pulse rounded-sm bg-elevated" />}>
        <Archived />
      </Suspense>
    </div>
  );
}

async function Archived() {
  const companies = await getCompanies({ archived: true });
  if (companies.length === 0) {
    return <p className="text-prose text-ink-muted">Nothing here.</p>;
  }
  return (
    <ul className="border-t border-hairline">
      {companies.map((c) => (
        <li key={c.id}>
          <Link
            href={`/companies/${c.id}`}
            className="flex min-h-16 items-center justify-between gap-4 border-b border-hairline py-4 hover:bg-card"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-mono text-eyebrow text-ink-muted">
                {c.exchange} · {c.ticker}
              </span>
              <span className="truncate text-body font-medium">{c.name}</span>
            </div>
            <span className="shrink-0 text-body-sm text-ink-muted">
              Stopped {shortDate(c.archived_at!)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
