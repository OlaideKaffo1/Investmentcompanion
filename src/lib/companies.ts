import "server-only";
import { requireOwner } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import { sharesHeld } from "@/lib/snapshots";
import { createClient } from "@/lib/supabase/server";

export const WATCHLIST_LIMIT = 20;

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
type SnapshotRow = Database["public"]["Tables"]["snapshots"]["Row"];

export type Company = CompanyRow & {
  currency: string;
  shares: number | null;
  value: number | null;
  gain: number | null; // value minus amount invested
  gainPct: number | null;
  weeklyChangePct: number | null; // from the latest snapshot
};

export type Snapshot = SnapshotRow;

// Adds the numbers every screen wants: shares, value now, and gain since
// you bought.
function withFigures(c: CompanyRow, weeklyChangePct: number | null = null): Company {
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
    weeklyChangePct,
  };
}

export async function getCompanies(): Promise<Company[]> {
  await requireOwner();
  const supabase = await createClient();

  const [companies, latest] = await Promise.all([
    supabase.from("companies").select("*").order("status").order("ticker"),
    supabase
      .from("snapshots")
      .select("company_id, week_of, weekly_change_pct")
      .order("week_of", { ascending: false })
      .limit(20 * 2),
  ]);
  if (companies.error) throw companies.error;
  if (latest.error) throw latest.error;

  const change = new Map<string, number | null>();
  for (const s of latest.data) {
    if (!change.has(s.company_id)) change.set(s.company_id, s.weekly_change_pct);
  }
  return companies.data.map((c) => withFigures(c, change.get(c.id) ?? null));
}

export async function getCompany(id: string) {
  await requireOwner();
  const supabase = await createClient();

  const [company, snapshots] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("snapshots")
      .select("*")
      .eq("company_id", id)
      .order("week_of", { ascending: false })
      .limit(52),
  ]);
  if (company.error) throw company.error;
  if (snapshots.error) throw snapshots.error;
  if (!company.data) return null;

  return {
    company: withFigures(company.data, snapshots.data[0]?.weekly_change_pct ?? null),
    snapshots: snapshots.data,
  };
}

export type WeekTotal = {
  weekOf: string;
  currency: string;
  value: number;
  invested: number;
  holdings: number;
};

// Your holdings added up for each saved week, kept separate per currency
// (naira and dollars can't be added together). Newest week first.
export async function getWeeklyTotals(weeks = 12): Promise<WeekTotal[]> {
  await requireOwner();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshots")
    .select("week_of, currency, value, amount_invested")
    .eq("status", "holding")
    .not("value", "is", null)
    .order("week_of", { ascending: false })
    .limit(weeks * WATCHLIST_LIMIT);
  if (error) throw error;

  const totals = new Map<string, WeekTotal>();
  for (const s of data) {
    const key = `${s.week_of}|${s.currency}`;
    const t = totals.get(key) ?? {
      weekOf: s.week_of,
      currency: s.currency,
      value: 0,
      invested: 0,
      holdings: 0,
    };
    t.value += s.value ?? 0;
    t.invested += s.amount_invested ?? 0;
    t.holdings += 1;
    totals.set(key, t);
  }
  return [...totals.values()].slice(0, weeks * 2);
}

export async function getLastSnapshotWeek(): Promise<string | null> {
  await requireOwner();
  const supabase = await createClient();
  const { data } = await supabase
    .from("snapshots")
    .select("week_of")
    .order("week_of", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.week_of ?? null;
}
