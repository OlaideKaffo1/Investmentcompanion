import { Suspense } from "react";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

// What's coming, in the order the spec builds it (Phase 1).
const NEXT_UP = [
  { title: "My companies", note: "Watchlist of up to 20, holdings and Sunday snapshots" },
  { title: "Company story cards", note: "What each company sells and how it makes money" },
  { title: "Weekly brief", note: "Your week in plain English, in the app and by email" },
  { title: "Glossary", note: "Tap any term for a one-line explanation" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Investing Companion</h1>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted underline underline-offset-4">
            Sign out
          </button>
        </form>
      </header>

      <Suspense fallback={<div className="card h-24 animate-pulse" />}>
        <Status />
      </Suspense>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Coming next
        </h2>
        <ul className="flex flex-col gap-3">
          {NEXT_UP.map((item) => (
            <li key={item.title} className="card">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted">{item.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto pt-6 text-xs text-muted">
        This app explains; you decide. Nothing here is financial advice.
      </footer>
    </main>
  );
}

// Proves the whole chain works: you're signed in, and the app can read and
// write your private data in the database.
async function Status() {
  const owner = await requireOwner();
  const supabase = await createClient();

  const settingsTable = supabase.from("user_settings");
  let { data: settings, error } = await settingsTable
    .select("timezone")
    .eq("user_id", owner.id)
    .maybeSingle();

  // First visit: create the settings row with its defaults.
  if (!settings && !error) {
    ({ data: settings, error } = await settingsTable
      .insert({ user_id: owner.id })
      .select("timezone")
      .single());
  }

  return (
    <section className="card flex flex-col gap-2">
      <p className="text-sm text-muted">Signed in as {owner.email}</p>
      {settings ? (
        <p className="text-sm">
          <span className="text-accent">●</span> Database connected · timezone{" "}
          {settings.timezone}
        </p>
      ) : (
        <p className="text-sm text-danger">
          ● Can&apos;t reach the database yet
          {error ? `: ${error.message}` : ""}. Have you run
          supabase/migrations/0001_init.sql?
        </p>
      )}
    </section>
  );
}
