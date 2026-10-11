import Link from "next/link";
import type { Company, CurrencySummary } from "@/lib/companies";
import { money, prosePercent, signedPercent, trend } from "@/lib/format";

const TONE = { up: "text-forest", down: "text-crimson", flat: "text-ink-muted" } as const;

// A change like "+3.2%". The sign says the direction; colour only backs it
// up, and only where it's the headline (tables pass quiet to stay ink).
export function Change({
  pct,
  quiet = false,
  className = "",
}: {
  pct: number | null;
  quiet?: boolean;
  className?: string;
}) {
  return (
    <span className={`figures ${quiet ? "" : TONE[trend(pct)]} ${className}`}>{signedPercent(pct)}</span>
  );
}

// One line in a list of companies: who it is on the left, the number that
// matters on the right (value for holdings, price otherwise) and how it moved
// this week. A stale typed-in price is flagged so it's never mistaken for live.
export function CompanyRow({ company: c }: { company: Company }) {
  const holding = c.status === "holding";
  const headline = holding && c.value != null ? money(c.value, c.currency) : money(c.last_price, c.currency);

  return (
    <li>
      <Link
        href={`/companies/${c.id}`}
        className="flex min-h-16 items-center justify-between gap-4 border-b border-hairline py-4 transition-colors hover:bg-card"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-eyebrow text-ink-muted">
            {c.exchange} · {c.ticker}
          </span>
          <span className="truncate text-body font-medium">{c.name}</span>
          {c.priceAge && (
            <span className="flex items-center gap-1.5 text-body-sm text-ink-muted">
              <span className="size-1.5 rounded-full bg-ember" aria-hidden />
              Price {c.priceAge}
            </span>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="figures text-body">{headline}</span>
          <span className="text-body-sm">
            {c.weeklyChangePct != null ? (
              <>
                <Change pct={c.weeklyChangePct} /> <span className="text-ink-muted">this week</span>
              </>
            ) : (
              <span className="text-ink-muted">{c.last_price ? "No weekly change yet" : "No price yet"}</span>
            )}
          </span>
        </div>
      </Link>
    </li>
  );
}

// Holdings in one currency at a glance: what they're worth, how that
// compares with what you put in, and this week.
export function CurrencyCard({ summary: s, href }: { summary: CurrencySummary; href?: string }) {
  const body = (
    <>
      <span className="eyebrow">{s.currency === "NGN" ? "Naira holdings" : "Dollar holdings"}</span>
      <span className="text-heading">{money(s.value, s.currency, { decimals: 0 })}</span>
      <span className="text-body-sm text-ink-muted">
        {s.gainPct != null && (
          <>
            {trend(s.gainPct) === "down" ? "Down" : "Up"} {prosePercent(s.gainPct)} on what you put in
          </>
        )}
        {s.gainPct != null && s.weeklyPct != null && " · "}
        {s.weeklyPct != null && (
          <>
            <Change pct={s.weeklyPct} /> this week
          </>
        )}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="card flex flex-col gap-1 transition-colors hover:bg-elevated">
      {body}
    </Link>
  ) : (
    <div className="card flex flex-col gap-1">{body}</div>
  );
}
