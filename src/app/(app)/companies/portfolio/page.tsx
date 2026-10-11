import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CurrencyCard } from "@/components/figures";
import { HistoryChart } from "@/components/history-chart";
import { getCompanies, getPortfolioHistory, summarize, type CurrencySummary } from "@/lib/companies";
import { money, signedMoney, signedPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Portfolio" };

// The digging-in view: your holdings over time, per currency. (The mix by
// sector and company size joins this page once company data arrives.)
export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-8 pt-8">
      <div className="flex flex-col gap-3">
        <Link href="/companies" className="btn-ghost self-start">
          ← Companies
        </Link>
        <h1 className="text-heading-lg">Portfolio</h1>
        <p className="text-body-sm text-ink-muted">
          Saved automatically every Sunday at 6pm Lagos time. This week uses today&apos;s prices.
          Naira and dollar holdings are kept apart.
        </p>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-sm bg-elevated" />}>
        <Currencies />
      </Suspense>
    </div>
  );
}

async function Currencies() {
  const summaries = summarize(await getCompanies());
  if (summaries.length === 0) {
    return (
      <p className="text-prose text-ink-muted">
        Once you add a holding with what you paid and a price, its value shows here and builds
        a history week by week.
      </p>
    );
  }
  return (
    <>
      {summaries.map((s) => (
        <CurrencyHistory key={s.currency} summary={s} />
      ))}
    </>
  );
}

async function CurrencyHistory({ summary }: { summary: CurrencySummary }) {
  const weeks = await getPortfolioHistory(summary.currency, summary);
  const name = summary.currency === "NGN" ? "Naira holdings" : "Dollar holdings";

  return (
    <section className="flex flex-col gap-4">
      <CurrencyCard summary={summary} />
      {weeks.length >= 2 ? (
        <HistoryChart
          label={`${name}, total value by week`}
          currency={summary.currency}
          points={weeks.map((w) => ({ label: w.label, value: w.value }))}
          reference={summary.invested ? { value: summary.invested, label: "You put in" } : undefined}
        />
      ) : (
        <p className="text-body-sm text-ink-muted">The chart starts after your first Sunday.</p>
      )}

      <details className="group">
        <summary className="btn-ghost cursor-pointer list-none py-2">
          <span className="group-open:hidden">Show week by week →</span>
          <span className="hidden group-open:inline">Hide week by week</span>
        </summary>
        <table className="figures mt-2 w-full text-body-sm">
          <thead>
            <tr className="text-left text-ink-muted">
              <th className="pb-2 font-normal">Week</th>
              <th className="pb-2 text-right font-normal">Worth</th>
              <th className="pb-2 text-right font-normal">vs put in</th>
            </tr>
          </thead>
          <tbody>
            {[...weeks].reverse().map((w) => {
              const gain = w.invested ? w.value - w.invested : null;
              return (
                <tr key={w.weekOf} className="border-t border-hairline">
                  <td className="py-2 pr-3 whitespace-nowrap">{w.label.replace("Week to ", "")}</td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap">{money(w.value, summary.currency)}</td>
                  <td className="py-2 text-right whitespace-nowrap text-ink-muted">
                    {gain == null ? (
                      "—"
                    ) : (
                      <>
                        {signedMoney(gain, summary.currency)}
                        <span className="block text-eyebrow">{signedPercent((gain / w.invested) * 100)}</span>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </section>
  );
}
