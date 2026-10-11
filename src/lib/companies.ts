import "server-only";
import { requireOwner } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { priceAge, weekLabel } from "@/lib/format";
import { sharesHeld, weekBefore, weekEnding } from "@/lib/snapshots";
import { createClient } from "@/lib/supabase/server";

export const WATCHLIST_LIMIT = 20;
// A move this size in a week is worth a look (the spec's alert threshold).
export const BIG_MOVE_PCT = 10;

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];

// One rule keeps every screen consistent: the company's current price is
// "now". This week's change, today's value and the last point on every chart
// are all worked out from it, compared with last Sunday's snapshot.
export type Company = CompanyRow & {
  currency: string;
  shares: number | null;
  value: number | null; // worth now
  gain: number | null; // worth now minus amount invested
  gainPct: number | null;
  weeklyChangePct: number | null; // price now vs last Sunday
  lastWeekValue: number | null; // holding value last Sunday
  priceAge: string | null; // "3 weeks old", once a price is stale
};

type LastWeek = { price: number | null; value: number | null };

function withFigures(c: CompanyRow, lastWeek?: LastWeek): Company {
  const shares = sharesHeld(c);
  const value = shares != null && c.last_price ? shares * c.last_price : null;
  const gain = value != null && c.amount_invested ? value - c.amount_invested : null;
  return {
    ...c,
    currency: c.currency ?? "USD",
    shares,
    value,
    gain,
    gainPct: gain != null && c.amount_invested ? (gain / c.amount_invested) * 100 : null,
    weeklyChangePct:
      lastWeek?.price && c.last_price ? (c.last_price / lastWeek.price - 1) * 100 : null,
    lastWeekValue: lastWeek?.value ?? null,
    priceAge: priceAge(c.last_price_at),
  };
}

async function lastSundayFigures(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyIds: string[],
) {
  if (companyIds.length === 0) return new Map<string, LastWeek>();
  const { data, error } = await supabase
    .from("snapshots")
    .select("company_id, price, value")
    .eq("week_of", weekBefore(weekEnding()))
    .in("company_id", companyIds);
  if (error) throw error;
  return new Map(data.map((s) => [s.company_id, { price: s.price, value: s.value }]));
}

// Companies you follow (or, with archived: true, the ones you stopped
// following), holdings first.
export async function getCompanies({ archived = false } = {}): Promise<Company[]> {
  await requireOwner();
  const supabase = await createClient();

  const query = supabase.from("companies").select("*").order("status").order("ticker");
  const { data, error } = archived
    ? await query.not("archived_at", "is", null)
    : await query.is("archived_at", null);
  if (error) throw error;

  const lastWeek = await lastSundayFigures(supabase, data.map((c) => c.id));
  return data.map((c) => withFigures(c, lastWeek.get(c.id)));
}

export async function countArchived() {
  await requireOwner();
  const supabase = await createClient();
  const { count } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .not("archived_at", "is", null);
  return count ?? 0;
}

export type WeekPoint = {
  weekOf: string;
  label: string; // "This week" / "Week to 11 Oct"
  price: number | null;
  value: number | null;
  changePct: number | null;
};

export async function getCompany(id: string) {
  await requireOwner();
  const supabase = await createClient();
  const currentWeek = weekEnding();

  const [company, snapshots] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("snapshots")
      .select("week_of, price, value, weekly_change_pct")
      .eq("company_id", id)
      .lt("week_of", currentWeek)
      .order("week_of", { ascending: false })
      .limit(52),
  ]);
  if (company.error) throw company.error;
  if (snapshots.error) throw snapshots.error;
  if (!company.data) return null;

  const lastSunday = snapshots.data.find((s) => s.week_of === weekBefore(currentWeek));
  const c = withFigures(company.data, lastSunday);

  // Finished weeks from the snapshots, then this week from the current price,
  // so the chart, the table and the headline numbers always agree.
  const weeks: WeekPoint[] = snapshots.data
    .map((s) => ({
      weekOf: s.week_of,
      label: weekLabel(s.week_of, currentWeek),
      price: s.price,
      value: s.value,
      changePct: s.weekly_change_pct,
    }))
    .reverse();
  if (c.last_price && !c.archived_at) {
    weeks.push({
      weekOf: currentWeek,
      label: weekLabel(currentWeek, currentWeek),
      price: c.last_price,
      value: c.value,
      changePct: c.weeklyChangePct,
    });
  }

  return { company: c, weeks }; // weeks oldest first
}

// ---------------------------------------------------------------------------
// Portfolio: holdings added up per currency. Naira and dollars are never
// added together.

export type CurrencySummary = {
  currency: string;
  value: number; // worth now, holdings with a price
  invested: number; // what you put into those same holdings
  gainPct: number | null;
  weeklyPct: number | null; // like-for-like: holdings that also had a value last Sunday
  holdings: number;
};

export function summarize(companies: Company[]): CurrencySummary[] {
  const byCurrency = new Map<string, CurrencySummary & { nowCmp: number; lastCmp: number }>();
  for (const c of companies) {
    if (c.status !== "holding" || c.value == null) continue;
    const s = byCurrency.get(c.currency) ?? {
      currency: c.currency,
      value: 0,
      invested: 0,
      gainPct: null,
      weeklyPct: null,
      holdings: 0,
      nowCmp: 0,
      lastCmp: 0,
    };
    s.value += c.value;
    s.invested += c.amount_invested ?? 0;
    s.holdings += 1;
    if (c.lastWeekValue) {
      s.nowCmp += c.value;
      s.lastCmp += c.lastWeekValue;
    }
    byCurrency.set(c.currency, s);
  }
  return [...byCurrency.values()]
    .map(({ nowCmp, lastCmp, ...s }) => ({
      ...s,
      gainPct: s.invested ? ((s.value - s.invested) / s.invested) * 100 : null,
      weeklyPct: lastCmp ? (nowCmp / lastCmp - 1) * 100 : null,
    }))
    // Naira first, then dollars.
    .sort((a, b) => (a.currency === b.currency ? 0 : a.currency === "NGN" ? -1 : 1));
}

export type PortfolioWeek = { weekOf: string; label: string; value: number; invested: number };

// Total holding value per finished week for one currency, then this week
// from current prices. Oldest first.
export async function getPortfolioHistory(
  currency: string,
  now: CurrencySummary,
  weeks = 26,
): Promise<PortfolioWeek[]> {
  await requireOwner();
  const supabase = await createClient();
  const currentWeek = weekEnding();

  const { data, error } = await supabase
    .from("snapshots")
    .select("week_of, value, amount_invested")
    .eq("currency", currency)
    .eq("status", "holding")
    .not("value", "is", null)
    .lt("week_of", currentWeek)
    .order("week_of", { ascending: false })
    .limit(weeks * WATCHLIST_LIMIT);
  if (error) throw error;

  const totals = new Map<string, PortfolioWeek>();
  for (const s of data) {
    const t = totals.get(s.week_of) ?? {
      weekOf: s.week_of,
      label: weekLabel(s.week_of, currentWeek),
      value: 0,
      invested: 0,
    };
    t.value += s.value ?? 0;
    t.invested += s.amount_invested ?? 0;
    totals.set(s.week_of, t);
  }
  const past = [...totals.values()].slice(0, weeks).reverse();
  return [
    ...past,
    { weekOf: currentWeek, label: "This week", value: now.value, invested: now.invested },
  ];
}
