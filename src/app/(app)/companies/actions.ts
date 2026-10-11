"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { LAGOS } from "@/lib/format";
import { takeSnapshot } from "@/lib/snapshots";
import { createClient } from "@/lib/supabase/server";

export type CompanyFormState = {
  error?: string;
  fieldErrors?: Partial<Record<CompanyField, string>>;
  // What was typed, handed back on an error so the form doesn't empty itself.
  values?: Record<string, string>;
};

type CompanyField =
  | "ticker"
  | "name"
  | "exchange"
  | "status"
  | "amount_invested"
  | "buy_date"
  | "buy_price"
  | "last_price";

// Adds a company, or updates one when the form carries an id.
export async function saveCompany(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const owner = await requireOwner();
  const id = text(formData, "id");
  const fieldErrors: CompanyFormState["fieldErrors"] = {};
  const values = Object.fromEntries(
    [...formData.entries()].filter(([k]) => !k.startsWith("$")).map(([k, v]) => [k, String(v)]),
  );

  const exchange = text(formData, "exchange");
  if (exchange !== "US" && exchange !== "NGX") fieldErrors.exchange = "Choose US or NGX.";

  const ticker = text(formData, "ticker").toUpperCase().replace(/\s/g, "");
  if (!/^[A-Z0-9.\-]{1,15}$/.test(ticker)) {
    fieldErrors.ticker = "Use the stock's ticker, e.g. NBIS or DANGCEM.";
  }

  const name = text(formData, "name");
  if (!name) fieldErrors.name = "Add the company's name.";
  else if (name.length > 120) fieldErrors.name = "Keep the name under 120 characters.";

  const status = text(formData, "status");
  if (status !== "holding" && status !== "watching") fieldErrors.status = "Choose one.";
  const holding = status === "holding";

  const amountInvested = holding ? amount(formData, "amount_invested", fieldErrors) : null;
  const buyPrice = holding ? amount(formData, "buy_price", fieldErrors) : null;
  const lastPrice = amount(formData, "last_price", fieldErrors);

  const buyDate = holding ? text(formData, "buy_date") || null : null;
  if (buyDate && (!/^\d{4}-\d{2}-\d{2}$/.test(buyDate) || buyDate > today())) {
    fieldErrors.buy_date = "Pick a date that isn't in the future.";
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const supabase = await createClient();
  const row = {
    ticker,
    name,
    exchange,
    status,
    amount_invested: amountInvested,
    buy_date: buyDate,
    buy_price: buyPrice,
  };

  // Only touch the price when it was typed or changed, so editing the name
  // doesn't make an old price look freshly checked.
  const priceChanged = text(formData, "last_price") !== text(formData, "last_price_before");
  const price = priceChanged
    ? { last_price: lastPrice, last_price_at: lastPrice ? new Date().toISOString() : null, price_source: lastPrice ? "manual" : null }
    : {};

  const result = id
    ? await supabase.from("companies").update({ ...row, ...price }).eq("id", id).select("id").single()
    : await supabase.from("companies").insert({ ...row, ...price, user_id: owner.id }).select("id").single();

  if (result.error) {
    if (result.error.code === "23505") {
      return { fieldErrors: { ticker: `${ticker} on ${exchange} is already on your list.` }, values };
    }
    if (result.error.message.includes("watchlist_full")) {
      return { error: "Your list is full at 20 companies. Remove one to add another.", values };
    }
    console.error("saveCompany failed:", result.error.message);
    return { error: "Couldn't save. Try again in a moment.", values };
  }

  redirect(`/companies/${result.data.id}`);
}

export async function removeCompany(formData: FormData) {
  await requireOwner();
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().eq("id", text(formData, "id"));
  if (error) throw new Error("Couldn't remove the company.");
  redirect("/companies");
}

// The same snapshot Sunday's job takes, run now for this week. Sunday's run
// replaces it, so it's safe to press any time.
export async function snapshotNow() {
  const owner = await requireOwner();
  const supabase = await createClient();
  await takeSnapshot(supabase, owner.id);
  refresh();
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

// Reads a money or price field. Empty means "not given"; commas, spaces and
// currency symbols are ignored so "₦1,500,000" works.
function amount(
  formData: FormData,
  key: CompanyField,
  errors: NonNullable<CompanyFormState["fieldErrors"]>,
): number | null {
  const raw = text(formData, key).replace(/[,\s₦$]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    errors[key] = "Enter a number above zero.";
    return null;
  }
  return n;
}

// Today's date in Lagos, as YYYY-MM-DD.
function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: LAGOS }).format(new Date());
}
