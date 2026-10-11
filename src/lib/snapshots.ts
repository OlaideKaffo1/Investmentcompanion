import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { LAGOS } from "@/lib/format";

type Client = SupabaseClient<Database>;

// The Sunday (Lagos time) that ends the week containing `now`, as YYYY-MM-DD.
// On a Sunday that's today; on a Wednesday it's four days ahead.
export function weekEnding(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const day = Date.UTC(Number(get("year")), Number(get("month")) - 1, Number(get("day")));
  return isoDay(day + ((7 - weekday) % 7) * DAY);
}

export function weekBefore(weekOf: string): string {
  return isoDay(Date.parse(`${weekOf}T00:00:00Z`) - 7 * DAY);
}

const DAY = 24 * 60 * 60 * 1000;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Shares come from what you paid: amount invested ÷ buy price.
export function sharesHeld(c: {
  status: string;
  amount_invested: number | null;
  buy_price: number | null;
}): number | null {
  if (c.status !== "holding" || !c.amount_invested || !c.buy_price) return null;
  return c.amount_invested / c.buy_price;
}

// Saves this week's row for every company you follow (archived ones keep
// their history but stop getting new weeks): the latest known
// price, the change since last week's snapshot, and what each holding is
// worth. Running it again in the same week replaces that week's rows.
export async function takeSnapshot(supabase: Client, userId: string, now = new Date()) {
  const weekOf = weekEnding(now);

  const [companies, previous] = await Promise.all([
    supabase
      .from("companies")
      .select("id, status, currency, last_price, last_price_at, amount_invested, buy_price")
      .eq("user_id", userId)
      .is("archived_at", null),
    supabase
      .from("snapshots")
      .select("company_id, price")
      .eq("user_id", userId)
      .eq("week_of", weekBefore(weekOf)),
  ]);
  if (companies.error) throw companies.error;
  if (previous.error) throw previous.error;

  const lastWeek = new Map(previous.data.map((s) => [s.company_id, s.price]));

  const rows = companies.data.map((c) => {
    const shares = sharesHeld(c);
    const before = lastWeek.get(c.id);
    return {
      user_id: userId,
      company_id: c.id,
      week_of: weekOf,
      status: c.status,
      currency: c.currency ?? "USD",
      price: c.last_price,
      price_at: c.last_price_at,
      weekly_change_pct:
        before && c.last_price ? round((c.last_price / before - 1) * 100, 4) : null,
      shares: shares == null ? null : round(shares, 8),
      value: shares != null && c.last_price ? round(shares * c.last_price, 2) : null,
      amount_invested: c.status === "holding" ? c.amount_invested : null,
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase
      .from("snapshots")
      .upsert(rows, { onConflict: "company_id,week_of" });
    if (error) throw error;
  }

  return { weekOf, companies: rows.length };
}

const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;
