import { Suspense } from "react";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

// What's coming, in the order the spec builds it (Phase 1).
const NEXT_UP = [
  { title: "My companies", note: "A watchlist of up to twenty, your holdings, and a snapshot every Sunday." },
  { title: "Company story cards", note: "What each company sells, who pays them, and how they make money." },
  { title: "Weekly brief", note: "Your week in plain English, here and in your inbox on Sunday evening." },
  { title: "Glossary", note: "Tap any term for a one-line explanation, with an example from your own companies." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-8">
      <header className="flex h-13 items-center justify-between">
        <span className="text-body-sm font-medium">Investing Companion</span>
        <form action={signOut}>
          <button type="submit" className="btn-ghost">
            Sign out
          </button>
        </form>
      </header>

      <Suspense fallback={<GreetingSkeleton />}>
        <Greeting />
      </Suspense>

      <section className="mt-12 flex flex-col gap-4">
        <h2 className="eyebrow">Coming next</h2>
        <ol className="flex flex-col border-t border-hairline">
          {NEXT_UP.map((item, i) => (
            <li key={item.title} className="flex gap-4 border-b border-hairline py-5">
              <span className="figures pt-0.5 font-mono text-eyebrow text-ink-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-body font-medium">{item.title}</p>
                <p className="font-serif text-prose text-ink-muted">{item.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-auto pt-12 font-serif text-body text-ink-muted italic">
        This app explains; you decide. Nothing here is financial advice.
      </footer>
    </main>
  );
}

// The greeting and status read your session and the database, so they
// stream in after the rest of the page.
async function Greeting() {
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

  const timeZone = settings?.timezone ?? "Africa/Lagos";
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone }).format(now),
  );
  const greeting = hour < 12 ? "Good morning." : hour < 17 ? "Good afternoon." : "Good evening.";
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(now);

  return (
    <section className="flex flex-col gap-6 pt-8">
      <div className="flex flex-col gap-3">
        <p className="eyebrow">{date}</p>
        <h1 className="text-heading-lg">{greeting}</h1>
        <p className="font-serif text-prose text-ink-muted">
          Nothing to read yet. Your companies, briefs and glossary will appear
          here as we build them, starting with your <em className="text-ember-text not-italic">watchlist</em>.
        </p>
      </div>

      <dl className="card grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 font-mono text-eyebrow">
        <dt className="text-ink-muted uppercase">Signed in</dt>
        <dd className="truncate">{owner.email}</dd>
        <dt className="text-ink-muted uppercase">Database</dt>
        {settings ? (
          <dd className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-forest" aria-hidden />
            Connected
          </dd>
        ) : (
          <dd className="text-crimson">
            Not reachable{error ? `: ${error.message}` : ""}. Run
            supabase/migrations/0001_init.sql.
          </dd>
        )}
        <dt className="text-ink-muted uppercase">Time zone</dt>
        <dd>{timeZone}</dd>
      </dl>
    </section>
  );
}

function GreetingSkeleton() {
  return (
    <section className="flex animate-pulse flex-col gap-6 pt-8" aria-hidden>
      <div className="flex flex-col gap-3">
        <div className="h-5 w-40 rounded-sm bg-elevated" />
        <div className="h-11 w-56 rounded-sm bg-elevated" />
        <div className="h-16 rounded-sm bg-elevated" />
      </div>
      <div className="card h-24" />
    </section>
  );
}
