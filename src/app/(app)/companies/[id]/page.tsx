import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Change } from "@/components/figures";
import { HistoryChart } from "@/components/history-chart";
import { getCompany, type Company } from "@/lib/companies";
import { dayMonth, longDate, money, shortDate, trend } from "@/lib/format";
import { removeCompany } from "../actions";
import { CompanyForm } from "../company-form";
import { RemoveButton } from "./remove-button";

export const metadata: Metadata = { title: "Company" };

export default function CompanyPage({ params }: PageProps<"/companies/[id]">) {
  return (
    <div className="flex flex-col gap-8 pt-8">
      <Link href="/companies" className="btn-ghost self-start">
        ← Companies
      </Link>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-sm bg-elevated" />}>
        {params.then(({ id }) => (
          <CompanyDetail id={id} />
        ))}
      </Suspense>
    </div>
  );
}

async function CompanyDetail({ id }: { id: string }) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const found = await getCompany(id);
  if (!found) notFound();
  const { company: c, snapshots } = found;
  const holding = c.status === "holding";
  const pricePoints = [...snapshots]
    .reverse()
    .filter((s) => s.price != null)
    .map((s) => ({ date: s.week_of, value: s.price! }));

  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="eyebrow">
          {c.exchange === "NGX" ? "Nigerian Exchange" : "US stock"} · {c.ticker} ·{" "}
          {holding ? "Holding" : "Watching"}
        </p>
        <h1 className="text-heading-lg">{c.name}</h1>
        <Summary company={c} />
      </div>

      <dl className="card grid grid-cols-2 gap-x-4 gap-y-5">
        <Figure label="Latest price">
          {money(c.last_price, c.currency)}
          {c.last_price_at && (
            <small className="block text-body-sm text-ink-muted">
              {c.price_source === "manual" ? "typed in" : "as of"} {shortDate(c.last_price_at)}
            </small>
          )}
        </Figure>
        <Figure label="This week">
          {c.weeklyChangePct != null ? <Change pct={c.weeklyChangePct} /> : "—"}
        </Figure>
        {holding && (
          <>
            <Figure label="Invested">{money(c.amount_invested, c.currency)}</Figure>
            <Figure label="Worth now">{money(c.value, c.currency)}</Figure>
            <Figure label="Shares">
              {c.shares != null ? c.shares.toLocaleString("en-GB", { maximumFractionDigits: 4 }) : "—"}
            </Figure>
            <Figure label="Bought">
              {c.buy_date ? shortDate(c.buy_date) : "—"}
              {c.buy_price && (
                <small className="block text-body-sm text-ink-muted">
                  at {money(c.buy_price, c.currency)}
                </small>
              )}
            </Figure>
          </>
        )}
      </dl>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading-sm">Price history</h2>
        {pricePoints.length >= 2 ? (
          <HistoryChart label={`${c.name} price by week`} currency={c.currency} points={pricePoints} />
        ) : (
          <p className="text-body-sm text-ink-muted">
            Each Sunday adds a point. The chart appears after the second one.
          </p>
        )}
        {snapshots.length > 0 && (
          <table className="figures w-full text-body-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2 font-normal">Week of</th>
                <th className="pb-2 text-right font-normal">Price</th>
                <th className="pb-2 text-right font-normal">Change</th>
                {holding && <th className="pb-2 text-right font-normal">Value</th>}
              </tr>
            </thead>
            <tbody>
              {snapshots.slice(0, 8).map((s) => (
                <tr key={s.id} className="border-t border-hairline">
                  <td className="py-2 pr-3 whitespace-nowrap">{dayMonth(s.week_of)}</td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap">{money(s.price, s.currency)}</td>
                  <td className="py-2 pr-3 text-right whitespace-nowrap">
                    <Change pct={s.weekly_change_pct} />
                  </td>
                  {holding && <td className="py-2 text-right whitespace-nowrap">{money(s.value, s.currency)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <details className="group border-t border-hairline pt-4">
        <summary className="cursor-pointer list-none text-body font-medium">
          <span className="group-open:hidden">Edit details →</span>
          <span className="hidden group-open:inline">Edit details ↓</span>
        </summary>
        <div className="pt-6">
          <CompanyForm
            initial={{
              id: c.id,
              ticker: c.ticker,
              name: c.name,
              exchange: c.exchange as "US" | "NGX",
              status: c.status as "holding" | "watching",
              amount_invested: c.amount_invested,
              buy_date: c.buy_date,
              buy_price: c.buy_price,
              last_price: c.last_price,
            }}
          />
        </div>
      </details>

      <form action={removeCompany} className="border-t border-hairline pt-4">
        <input type="hidden" name="id" value={c.id} />
        <RemoveButton name={c.name} />
      </form>
    </>
  );
}

// One plain-English sentence about where things stand.
function Summary({ company: c }: { company: Company }) {
  let text: string;
  if (c.status === "holding" && c.gain != null && c.buy_date) {
    const dir = trend(c.gain);
    text =
      dir === "flat"
        ? `Worth about what you paid on ${longDate(c.buy_date)}.`
        : `${dir === "up" ? "Up" : "Down"} ${money(Math.abs(c.gain), c.currency)} (${pct(c.gainPct)}) since you bought on ${longDate(c.buy_date)}.`;
  } else if (c.status === "holding" && c.gain != null) {
    text = `${trend(c.gain) === "down" ? "Down" : "Up"} ${pct(c.gainPct)} on what you put in.`;
  } else if (c.status === "holding") {
    text = "Add what you invested, your buy price and a latest price to see how it's doing.";
  } else if (!c.last_price) {
    text = "No price yet. Live prices arrive in the next step, or you can type one in below.";
  } else {
    text = `On your watchlist since ${longDate(c.created_at)}.`;
  }
  return <p className="text-prose text-ink-muted">{text}</p>;
}

const pct = (n: number | null) => `${Math.abs(n ?? 0).toFixed(1)}%`;

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="eyebrow">{label}</dt>
      <dd className="figures text-body">{children}</dd>
    </div>
  );
}
