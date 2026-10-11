import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Change } from "@/components/figures";
import { HistoryChart } from "@/components/history-chart";
import { getCompany, type Company } from "@/lib/companies";
import { longDate, money, monthYear, proseMoney, prosePercent, shortDate, trend } from "@/lib/format";
import { archiveCompany, deleteCompany } from "../actions";
import { CompanyForm } from "../company-form";
import { ConfirmButton, RestoreForm } from "./archive-controls";

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

// Order: who it is → the answer (worth now, since you bought) → the chart
// with what you paid on it → details, history and edit, folded away.
async function CompanyDetail({ id }: { id: string }) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const found = await getCompany(id);
  if (!found) notFound();
  const { company: c, weeks } = found;
  const holding = c.status === "holding";
  const byValue = holding && c.value != null;
  const chartWeeks = weeks.filter((w) => (byValue ? w.value : w.price) != null);

  return (
    <>
      {c.archived_at && (
        <div className="card flex flex-col gap-3">
          <p className="text-body">
            You stopped following {c.name} on {longDate(c.archived_at)}. Its history is kept here.
          </p>
          <RestoreForm id={c.id} />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="eyebrow">
          {c.exchange === "NGX" ? "Nigerian Exchange" : "US stock"} · {c.ticker} ·{" "}
          {holding ? "You own shares" : "Watching"}
        </p>
        <h1 className="text-heading-lg">{c.name}</h1>
      </div>

      <Headline company={c} />

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow">{byValue ? "Value by week" : "Price by week"}</h2>
        {chartWeeks.length >= 2 ? (
          <HistoryChart
            label={`${c.name} ${byValue ? "value" : "price"} by week`}
            currency={c.currency}
            points={chartWeeks.map((w) => ({ label: w.label, value: (byValue ? w.value : w.price)! }))}
            reference={
              byValue && c.amount_invested
                ? { value: c.amount_invested, label: "You put in" }
                : holding && c.buy_price
                  ? { value: c.buy_price, label: "You bought at" }
                  : undefined
            }
          />
        ) : (
          <p className="text-body-sm text-ink-muted">
            Each Sunday adds a week. The chart appears once there are two.
          </p>
        )}
      </section>

      <div className="flex flex-col">
        <Fold title="Details">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 pb-4 pt-2">
            <Figure label="Latest price">
              {money(c.last_price, c.currency)}
              {c.last_price_at && (
                <small className="block text-body-sm text-ink-muted">
                  {c.price_source === "manual" ? "Typed in" : "As of"} {shortDate(c.last_price_at)}
                  {c.priceAge ? ` · ${c.priceAge}` : ""}
                </small>
              )}
            </Figure>
            <Figure label="This week">
              {c.weeklyChangePct != null ? <Change pct={c.weeklyChangePct} /> : "—"}
            </Figure>
            {holding ? (
              <>
                <Figure label="You put in">{money(c.amount_invested, c.currency)}</Figure>
                <Figure label="Shares">
                  {c.shares != null ? c.shares.toLocaleString("en-GB", { maximumFractionDigits: 4 }) : "—"}
                </Figure>
                <Figure label="Bought">
                  {c.buy_date ? shortDate(c.buy_date) : "—"}
                  {c.buy_price && (
                    <small className="block text-body-sm text-ink-muted">at {money(c.buy_price, c.currency)}</small>
                  )}
                </Figure>
              </>
            ) : (
              <Figure label="Watching since">{monthYear(c.created_at)}</Figure>
            )}
          </dl>
        </Fold>

        {weeks.length > 0 && (
          <Fold title="Week by week">
            <table className="figures mb-4 w-full text-body-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-normal">Week</th>
                  <th className="pb-2 text-right font-normal">Price</th>
                  <th className="pb-2 text-right font-normal">Change</th>
                  {holding && <th className="pb-2 text-right font-normal">Worth</th>}
                </tr>
              </thead>
              <tbody>
                {[...weeks].reverse().map((w) => (
                  <tr key={w.weekOf} className="border-t border-hairline">
                    <td className="py-2 pr-3 whitespace-nowrap">{w.label.replace("Week to ", "")}</td>
                    <td className="py-2 pr-3 text-right whitespace-nowrap">{money(w.price, c.currency)}</td>
                    <td className="py-2 pr-3 text-right whitespace-nowrap">
                      <Change pct={w.changePct} quiet />
                    </td>
                    {holding && <td className="py-2 text-right whitespace-nowrap">{money(w.value, c.currency)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </Fold>
        )}

        {!c.archived_at && (
          <Fold title="Edit">
            <div className="pb-6 pt-4">
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
          </Fold>
        )}
      </div>

      <div className="pt-2">
        {c.archived_at ? (
          <form action={deleteCompany}>
            <input type="hidden" name="id" value={c.id} />
            <ConfirmButton
              className="py-2 text-body-sm text-crimson underline-offset-4 hover:underline"
              message={`Delete ${c.name} and all its history for good? This can't be undone.`}
              pendingLabel="Deleting…"
            >
              Delete for good
            </ConfirmButton>
          </form>
        ) : (
          <form action={archiveCompany}>
            <input type="hidden" name="id" value={c.id} />
            <ConfirmButton
              className="btn-ghost py-2"
              message={`Stop following ${c.name}? It moves to your archive with its history, and you can follow it again any time.`}
              pendingLabel="Moving…"
            >
              Stop following
            </ConfirmButton>
          </form>
        )}
      </div>
    </>
  );
}

// The answer, before any detail: what it's worth (or costs) and one sentence
// on how it's done, in rounded words. Then this week, quietly.
function Headline({ company: c }: { company: Company }) {
  const holding = c.status === "holding";
  const big = holding && c.value != null ? c.value : c.last_price;

  let sentence: string;
  if (holding && c.gain != null) {
    const dir = trend(c.gain);
    const since = c.buy_date ? `since you bought in ${monthYear(c.buy_date)}` : "on what you put in";
    sentence =
      dir === "flat"
        ? `About what you paid, ${since}.`
        : `${dir === "up" ? "Up" : "Down"} ${proseMoney(c.gain, c.currency)}, or ${prosePercent(c.gainPct!)}, ${since}.`;
  } else if (holding && !c.last_price) {
    sentence = "No price yet, so it can't be valued. Live prices arrive soon, or add one under Edit.";
  } else if (holding) {
    sentence = "Add what you put in and your buy price under Edit to see how it's doing.";
  } else if (!c.last_price) {
    sentence = "No price yet. Live prices arrive soon, or add one under Edit.";
  } else {
    sentence = `You've been watching since ${monthYear(c.created_at)}.`;
  }

  return (
    <section className="flex flex-col gap-2">
      {big != null && (
        <>
          <span className="eyebrow">{holding && c.value != null ? "Worth now" : "Price"}</span>
          <span className="text-heading-lg">{money(big, c.currency)}</span>
        </>
      )}
      <p className="text-prose text-ink-muted">{sentence}</p>
      {(c.weeklyChangePct != null || c.priceAge) && (
        <p className="text-body-sm text-ink-muted">
          {c.weeklyChangePct != null && (
            <>
              <Change pct={c.weeklyChangePct} /> this week
            </>
          )}
          {c.weeklyChangePct != null && c.priceAge && " · "}
          {c.priceAge && <>price {c.priceAge}</>}
        </p>
      )}
    </section>
  );
}

// A row that opens to reveal detail: for things you look at sometimes.
function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-hairline last:border-b">
      <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between text-body font-medium">
        {title}
        <span className="text-ink-muted transition-transform group-open:rotate-90" aria-hidden>
          →
        </span>
      </summary>
      {children}
    </details>
  );
}

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="eyebrow">{label}</dt>
      <dd className="figures text-body">{children}</dd>
    </div>
  );
}
