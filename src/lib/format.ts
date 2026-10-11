// Formatting helpers shared by every screen. Plain, consistent numbers:
// ₦ and $ symbols, thousands separators, and signs on changes.

export type Currency = "USD" | "NGN";
export type Exchange = "US" | "NGX";

export const LAGOS = "Africa/Lagos";

export function money(
  value: number | null | undefined,
  currency: string,
  { decimals }: { decimals?: number } = {},
) {
  if (value == null) return "—";
  const digits = decimals ?? (Math.abs(value) >= 1000 ? 0 : 2);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

// "+3.2%" / "−1.4%". Uses a real minus sign so columns line up.
export function signedPercent(value: number | null | undefined, digits = 1) {
  if (value == null) return "—";
  const abs = Math.abs(value).toFixed(digits);
  if (Number(abs) === 0) return `0.${"0".repeat(digits)}%`;
  return `${value > 0 ? "+" : "−"}${abs}%`;
}

export function signedMoney(value: number | null | undefined, currency: string) {
  if (value == null) return "—";
  const formatted = money(Math.abs(value), currency);
  if (Math.round(value * 100) === 0) return formatted;
  return `${value > 0 ? "+" : "−"}${formatted}`;
}

// Which way a number moved, for colour. Colour is never the only signal:
// the sign or the words say it too.
export function trend(value: number | null | undefined): "up" | "down" | "flat" {
  if (value == null || Math.abs(value) < 0.005) return "flat";
  return value > 0 ? "up" : "down";
}

export function shortDate(isoDate: string | null | undefined) {
  if (!isoDate) return "—";
  // Plain dates ("2026-10-11") are calendar days; read them at noon UTC so
  // they never slip a day in any time zone.
  const date = isoDate.length === 10 ? new Date(`${isoDate}T12:00:00Z`) : new Date(isoDate);
  // Built from parts so the server and every browser print exactly
  // "Sun 11 Oct" (some add a comma), which keeps the page from flickering.
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: LAGOS,
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("weekday")} ${part("day")} ${part("month")}`;
}

// "11 Oct": for tables and chart axes, where every row is a Sunday anyway.
export function dayMonth(isoDate: string) {
  return shortDate(isoDate).split(" ").slice(1).join(" ");
}

export function longDate(isoDate: string) {
  const date = isoDate.length === 10 ? new Date(`${isoDate}T12:00:00Z`) : new Date(isoDate);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: LAGOS,
  }).format(date);
}

export function currencyFor(exchange: Exchange): Currency {
  return exchange === "NGX" ? "NGN" : "USD";
}

export function currencySymbol(currency: string) {
  return currency === "NGN" ? "₦" : "$";
}

// --- Words, not statements -------------------------------------------------
// Sentences round ("up $500, or 50%"; "₦1.57 million"). Tables and prices
// stay exact.

export function proseMoney(value: number, currency: string) {
  const abs = Math.abs(value);
  const symbol = currencySymbol(currency);
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    return `${symbol}${millions.toLocaleString("en-GB", { maximumSignificantDigits: 3 })} million`;
  }
  return money(abs, currency, { decimals: abs < 10 ? 2 : 0 });
}

// "6.7%" under ten, "50%" above: enough to compare, no false precision.
export function prosePercent(value: number) {
  const abs = Math.abs(value);
  return `${abs < 10 ? abs.toFixed(1) : Math.round(abs)}%`;
}

export function monthYear(isoDate: string) {
  const date = isoDate.length === 10 ? new Date(`${isoDate}T12:00:00Z`) : new Date(isoDate);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: LAGOS }).format(date);
}

// Weeks are stored by the Sunday that ends them. The one still running is
// "This week"; finished ones read "Week to 11 Oct".
export function weekLabel(weekOf: string, currentWeek: string) {
  return weekOf === currentWeek ? "This week" : `Week to ${dayMonth(weekOf)}`;
}

// How old a price is, only once it's old enough to matter (a week or more).
export function priceAge(pricedAt: string | null, now = new Date()): string | null {
  if (!pricedAt) return null;
  const days = Math.floor((now.getTime() - new Date(pricedAt).getTime()) / 86_400_000);
  if (days < 7) return null;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week old" : `${weeks} weeks old`;
}
