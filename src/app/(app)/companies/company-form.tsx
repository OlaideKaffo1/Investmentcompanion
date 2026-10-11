"use client";

import { useActionState, useState } from "react";
import { currencySymbol, type Exchange } from "@/lib/format";
import { saveCompany, type CompanyFormState } from "./actions";

export type CompanyFormValues = {
  id?: string;
  ticker?: string;
  name?: string;
  exchange?: Exchange;
  status?: "holding" | "watching";
  amount_invested?: number | null;
  buy_date?: string | null;
  buy_price?: number | null;
  last_price?: number | null;
};

export function CompanyForm({ initial = {} }: { initial?: CompanyFormValues }) {
  const [state, action, pending] = useActionState<CompanyFormState, FormData>(saveCompany, {});
  // After a failed save, show what was typed rather than the starting values.
  const v = (key: keyof CompanyFormValues) => state.values?.[key] ?? initial[key] ?? "";
  const [exchange, setExchange] = useState<Exchange>(initial.exchange ?? "US");
  const [status, setStatus] = useState(initial.status ?? "watching");
  const symbol = currencySymbol(exchange === "NGX" ? "NGN" : "USD");
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="last_price_before" value={initial.last_price ?? ""} />

      <Segmented
        label="Market"
        name="exchange"
        value={exchange}
        onChange={(v) => setExchange(v as Exchange)}
        options={[
          { value: "US", label: "US stocks" },
          { value: "NGX", label: "Nigeria (NGX)" },
        ]}
        error={errors.exchange}
      />

      <Field label="Ticker" hint={exchange === "NGX" ? "For example DANGCEM or GTCO" : "For example NBIS or AAPL"} error={errors.ticker}>
        <input
          name="ticker"
          defaultValue={v("ticker")}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          required
          className="field font-mono uppercase"
        />
      </Field>

      <Field label="Company name" error={errors.name}>
        <input name="name" defaultValue={v("name")} required className="field" autoComplete="off" />
      </Field>

      <Segmented
        label="I am"
        name="status"
        value={status}
        onChange={(v) => setStatus(v as "holding" | "watching")}
        options={[
          { value: "watching", label: "Watching" },
          { value: "holding", label: "Holding" },
        ]}
        error={errors.status}
      />

      {status === "holding" && (
        <fieldset className="flex flex-col gap-4 border-l-2 border-hairline pl-4">
          <legend className="mb-2 text-body-sm text-ink-muted">
            Optional. Add these to see what your holding is worth.
          </legend>
          <Field label={`Amount invested (${symbol})`} error={errors.amount_invested}>
            <input name="amount_invested" inputMode="decimal" defaultValue={v("amount_invested")} className="field figures" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Buy date" error={errors.buy_date}>
              <input name="buy_date" type="date" defaultValue={v("buy_date")} className="field" />
            </Field>
            <Field label={`Buy price (${symbol})`} error={errors.buy_price}>
              <input name="buy_price" inputMode="decimal" defaultValue={v("buy_price")} className="field figures" />
            </Field>
          </div>
        </fieldset>
      )}

      <Field
        label={`Latest price (${symbol})`}
        hint="Optional. Live prices arrive in the next step; until then you can type it in."
        error={errors.last_price}
      >
        <input name="last_price" inputMode="decimal" defaultValue={v("last_price")} className="field figures" />
      </Field>

      {state.error && <p className="text-body-sm text-crimson">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : initial.id ? "Save changes" : "Add to my list"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="eyebrow">{label}</span>
      {children}
      {error ? (
        <span className="text-body-sm text-crimson">{error}</span>
      ) : (
        hint && <span className="text-body-sm text-ink-muted">{hint}</span>
      )}
    </label>
  );
}

function Segmented({
  label,
  name,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="eyebrow mb-2">{label}</legend>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-hairline bg-hairline">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center justify-center bg-card py-3 text-body transition-colors has-[:checked]:bg-ink has-[:checked]:text-on-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ember"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && <span className="text-body-sm text-crimson">{error}</span>}
    </fieldset>
  );
}
