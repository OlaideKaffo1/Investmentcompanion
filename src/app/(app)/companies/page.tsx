import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CompanyRow } from "@/components/figures";
import { countArchived, getCompanies, summarize, WATCHLIST_LIMIT } from "@/lib/companies";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Companies" };

// Your list, and nothing else: holdings, then what you're watching. History
// and the portfolio view are one tap away, not stacked underneath.
export default function CompaniesPage() {
  return (
    <div className="flex flex-col gap-8 pt-8">
      <Suspense fallback={<ListSkeleton />}>
        <Watchlist />
      </Suspense>
    </div>
  );
}

async function Watchlist() {
  const [companies, archived] = await Promise.all([getCompanies(), countArchived()]);
  const holdings = companies.filter((c) => c.status === "holding");
  const watching = companies.filter((c) => c.status === "watching");
  const summaries = summarize(companies);
  const full = companies.length >= WATCHLIST_LIMIT;

  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="eyebrow">
          Following {companies.length} of {WATCHLIST_LIMIT}
        </p>
        <h1 className="text-heading-lg">Companies</h1>
        {companies.length === 0 && (
          <p className="text-prose text-ink-muted">
            Add the companies you own and the ones you&apos;re curious about. You can follow up
            to twenty, from the US or the Nigerian Exchange.
          </p>
        )}
      </div>

      {summaries.length > 0 && (
        <Link
          href="/companies/portfolio"
          className="card flex items-center justify-between gap-4 transition-colors hover:bg-elevated"
        >
          <div className="flex flex-col gap-1">
            <span className="eyebrow">Your holdings</span>
            <span className="figures text-body">
              {summaries.map((s) => money(s.value, s.currency, { decimals: 0 })).join("  ·  ")}
            </span>
          </div>
          <span className="text-body-sm text-ink-muted">History →</span>
        </Link>
      )}

      {holdings.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow">Holding</h2>
          <ul className="border-t border-hairline">
            {holdings.map((c) => (
              <CompanyRow key={c.id} company={c} />
            ))}
          </ul>
        </section>
      )}

      {watching.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow">Watching</h2>
          <ul className="border-t border-hairline">
            {watching.map((c) => (
              <CompanyRow key={c.id} company={c} />
            ))}
          </ul>
        </section>
      )}

      {full ? (
        <p className="text-body-sm text-ink-muted">
          Your list is full. Stop following a company to add another.
        </p>
      ) : (
        <Link href="/companies/new" className={companies.length === 0 ? "btn-primary text-center" : "btn-secondary text-center"}>
          Add a company
        </Link>
      )}

      {archived > 0 && (
        <Link href="/companies/archive" className="btn-ghost self-start py-2">
          Archive ({archived}) →
        </Link>
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-hidden>
      <div className="h-5 w-32 rounded-sm bg-elevated" />
      <div className="h-11 w-48 rounded-sm bg-elevated" />
      <div className="h-16 rounded-sm bg-elevated" />
      <div className="h-40 rounded-sm bg-elevated" />
    </div>
  );
}
