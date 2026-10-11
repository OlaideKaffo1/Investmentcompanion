import Link from "next/link";
import type { Company } from "@/lib/companies";
import { money, signedPercent, trend } from "@/lib/format";

const TONE = { up: "text-forest", down: "text-crimson", flat: "text-ink-muted" } as const;

// A change like "+3.2%". The sign says the direction; colour only backs it up.
export function Change({ pct, className = "" }: { pct: number | null; className?: string }) {
  return <span className={`figures ${TONE[trend(pct)]} ${className}`}>{signedPercent(pct)}</span>;
}

// One line in a list of companies: ticker and name on the left, the numbers
// that matter on the right. Holdings show what they're worth; watched
// companies show their price.
export function CompanyRow({ company: c }: { company: Company }) {
  const holding = c.status === "holding";
  const headline = holding && c.value != null ? money(c.value, c.currency) : money(c.last_price, c.currency);

  return (
    <li>
      <Link
        href={`/companies/${c.id}`}
        className="flex items-center justify-between gap-4 border-b border-hairline py-4 transition-colors hover:bg-card"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-eyebrow text-ink-muted">
            {c.exchange} · {c.ticker}
          </span>
          <span className="truncate text-body font-medium">{c.name}</span>
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
