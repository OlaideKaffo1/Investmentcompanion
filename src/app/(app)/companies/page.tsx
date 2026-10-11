import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HistoryChart } from "@/components/history-chart";
import { CompanyRow } from "@/components/figures";
import {
  getCompanies,
  getLastSnapshotWeek,
  getWeeklyTotals,
  WATCHLIST_LIMIT,
  type WeekTotal,
} from "@/lib/companies";
import { dayMonth, money, shortDate, signedMoney, signedPercent } from "@/lib/format";
import { snapshotNow } from "./actions";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  return (
    <div className="flex flex-col gap-10 pt-8">
      <Suspense fallback={<ListSkeleton />}>
        <Watchlist />
      </Suspense>
      <Suspense fallback={null}>
        <Snapshots />
      </Suspense>
    </div>
  );
}

async function Watchlist() {
  const companies = await getCompanies();
  const holdings = companies.filter((c) => c.status === "holding");
  const watching = companies.filter((c) => c.status === "watching");
  const full = companies.length >= WATCHLIST_LIMIT;

  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="eyebrow">
          {companies.length} of {WATCHLIST_LIMIT} companies
        </p>
        <h1 className="text-heading-lg">Companies</h1>
        {companies.length === 0 && (
          <p className="text-prose text-ink-muted">
            Add the companies you own and the ones you&apos;re curious about. You can follow up
            to twenty, from the US or the Nigerian Exchange.
          </p>
        )}
      </div>

      {full ? (
        <p className="text-body-sm text-ink-muted">
          Your list is full. Remove a company to add another.
        </p>
      ) : (
        <Link href="/companies/new" className="btn-primary text-center">
          Add a company
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
    </>
  );
}

async function Snapshots() {
  const [lastWeek, totals] = await Promise.all([getLastSnapshotWeek(), getWeeklyTotals()]);
  const currencies = [...new Set(totals.map((t) => t.currency))];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-heading-sm">Sunday snapshots</h2>
        <p className="text-body-sm text-ink-muted">
          Every Sunday at 6pm Lagos time the app saves each company&apos;s price and what your
          holdings are worth. Over the weeks this becomes your history.
          {lastWeek ? ` Last saved for the week of ${shortDate(lastWeek)}.` : " Nothing saved yet."}
        </p>
      </div>

      {currencies.map((currency) => (
        <PortfolioHistory
          key={currency}
          currency={currency}
          weeks={totals.filter((t) => t.currency === currency)}
        />
      ))}

      <form action={snapshotNow}>
        <button type="submit" className="btn-ghost underline">
          Save this week&apos;s snapshot now
        </button>
      </form>
    </section>
  );
}

// Holdings in one currency, week by week: a chart once there are two weeks,
// and always the table with the same numbers.
function PortfolioHistory({ currency, weeks }: { currency: string; weeks: WeekTotal[] }) {
  const label = currency === "NGN" ? "Naira holdings" : "Dollar holdings";
  const oldestFirst = [...weeks].reverse();

  return (
    <div className="card flex flex-col gap-4">
      <h3 className="eyebrow">{label}, total value</h3>
      <HistoryChart
        label={`${label}, total value by week`}
        currency={currency}
        points={oldestFirst.map((w) => ({ date: w.weekOf, value: w.value }))}
      />
      {weeks.length < 2 && (
        <p className="text-body-sm text-ink-muted">The chart appears after your second Sunday.</p>
      )}
      <table className="figures w-full text-body-sm">
        <thead>
          <tr className="text-left text-ink-muted">
            <th className="pb-2 font-normal">Week of</th>
            <th className="pb-2 text-right font-normal">Value</th>
            <th className="pb-2 text-right font-normal">vs invested</th>
          </tr>
        </thead>
        <tbody>
          {weeks.slice(0, 6).map((w) => {
            const gain = w.invested ? w.value - w.invested : null;
            return (
              <tr key={w.weekOf} className="border-t border-hairline">
                <td className="py-2 pr-3 whitespace-nowrap">{dayMonth(w.weekOf)}</td>
                <td className="py-2 pr-3 text-right whitespace-nowrap">{money(w.value, currency)}</td>
                <td className="py-2 text-right whitespace-nowrap text-ink-muted">
                  {gain == null ? (
                    "—"
                  ) : (
                    <>
                      {signedMoney(gain, currency)}
                      <span className="block text-eyebrow">{signedPercent((gain / w.invested) * 100)}</span>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-hidden>
      <div className="h-5 w-32 rounded-sm bg-elevated" />
      <div className="h-11 w-48 rounded-sm bg-elevated" />
      <div className="h-12 rounded-sm bg-elevated" />
      <div className="h-40 rounded-sm bg-elevated" />
    </div>
  );
}
