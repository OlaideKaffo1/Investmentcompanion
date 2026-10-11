import Link from "next/link";
import { Suspense } from "react";
import { CompanyRow, CurrencyCard } from "@/components/figures";
import { requireOwner } from "@/lib/auth";
import {
  BIG_MOVE_PCT,
  getCompanies,
  summarize,
  type Company,
  type CurrencySummary,
} from "@/lib/companies";
import { LAGOS, prosePercent } from "@/lib/format";

// Today, in the order you need it:
//   1. one sentence: how was the week?           (glance, 5 seconds)
//   2. your holdings, per currency               (glance)
//   3. anything worth a look, usually nothing    (understand)
//   4. your companies                            (dig in from here)
export default function Home() {
  return (
    <>
      <Suspense fallback={<Skeleton />}>
        <Today />
      </Suspense>

      <footer className="mt-auto flex flex-col gap-2 pt-12 text-body-sm text-ink-muted">
        <p>Coming next: live prices and company stories, then your weekly brief.</p>
        <p>This app explains; you decide. Nothing here is financial advice.</p>
      </footer>
    </>
  );
}

async function Today() {
  await requireOwner();
  const companies = await getCompanies();
  const summaries = summarize(companies);
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: LAGOS,
  }).format(new Date());

  if (companies.length === 0) {
    return (
      <section className="flex flex-col gap-6 pt-8">
        <div className="flex flex-col gap-3">
          <p className="eyebrow">{date}</p>
          <h1 className="text-heading-lg">Let&apos;s start with your companies.</h1>
          <p className="text-prose text-ink-muted">
            Add what you own and what you&apos;re curious about. Everything here (your weekly
            brief, story cards, alerts) is built around them.
          </p>
        </div>
        <Link href="/companies/new" className="btn-primary text-center">
          Add your first company
        </Link>
      </section>
    );
  }

  const notes = worthALook(companies);

  return (
    <>
      <section className="flex flex-col gap-3 pt-8">
        <p className="eyebrow">{date}</p>
        <h1 className="text-heading-lg">{headline(summaries)}</h1>
      </section>

      {summaries.length > 0 && (
        <section className="mt-6 flex flex-col gap-3" aria-label="Your holdings">
          {summaries.map((s) => (
            <CurrencyCard key={s.currency} summary={s} href="/companies/portfolio" />
          ))}
        </section>
      )}

      <section className="mt-10 flex flex-col gap-3">
        <h2 className="eyebrow">Worth a look</h2>
        {notes.length === 0 ? (
          <p className="text-prose text-ink-muted">Nothing needs your attention this week.</p>
        ) : (
          <ul className="flex flex-col border-t border-hairline">
            {notes.map((n) => (
              <li key={n.key}>
                <Link
                  href={n.href}
                  className="flex min-h-12 items-center justify-between gap-4 border-b border-hairline py-3 text-body hover:bg-card"
                >
                  {n.text}
                  <span className="text-ink-muted" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">My companies</h2>
          <Link href="/companies" className="link -my-3 py-3 pl-6 text-body-sm">
            See all
          </Link>
        </div>
        <ul className="border-t border-hairline">
          {companies.slice(0, 5).map((c) => (
            <CompanyRow key={c.id} company={c} />
          ))}
        </ul>
      </section>
    </>
  );
}

// The week in one calm sentence, from how each currency's holdings moved.
function headline(summaries: CurrencySummary[]) {
  if (summaries.length === 0) return "Here's what you're watching.";
  const moves = summaries.map((s) => s.weeklyPct).filter((p): p is number => p != null);
  if (moves.length === 0) return "Here's where your holdings stand.";
  const ups = moves.filter((p) => p >= 0.5).length;
  const downs = moves.filter((p) => p <= -0.5).length;
  if (ups === 0 && downs === 0) return "A quiet week for your holdings.";
  if (downs === 0) return "A good week for your holdings.";
  if (ups === 0) return "A softer week for your holdings.";
  return "A mixed week for your holdings.";
}

// At most three things, most important first. Usually there are none, and
// that's the point: the app only asks for attention when it's earned.
function worthALook(companies: Company[]) {
  const notes: { key: string; href: string; text: string }[] = [];
  const href = (c: Company) => `/companies/${c.id}`;

  for (const c of companies) {
    if (c.weeklyChangePct != null && Math.abs(c.weeklyChangePct) >= BIG_MOVE_PCT) {
      const dir = c.weeklyChangePct > 0 ? "rose" : "fell";
      notes.push({ key: `move-${c.id}`, href: href(c), text: `${c.name} ${dir} ${prosePercent(c.weeklyChangePct)} this week.` });
    }
  }
  for (const c of companies) {
    if (c.status === "holding" && (!c.amount_invested || !c.buy_price)) {
      notes.push({ key: `paid-${c.id}`, href: href(c), text: `Add what you paid for ${c.name} to see how it's doing.` });
    }
  }
  for (const c of companies) {
    if (c.priceAge) {
      notes.push({ key: `stale-${c.id}`, href: href(c), text: `${c.name}'s price is ${c.priceAge}.` });
    }
  }
  return notes.slice(0, 3);
}

function Skeleton() {
  return (
    <section className="flex animate-pulse flex-col gap-3 pt-8" aria-hidden>
      <div className="h-5 w-40 rounded-sm bg-elevated" />
      <div className="h-11 w-64 rounded-sm bg-elevated" />
      <div className="mt-3 h-24 rounded-sm bg-elevated" />
    </section>
  );
}
