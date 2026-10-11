import Link from "next/link";
import { Suspense } from "react";
import { CompanyRow } from "@/components/figures";
import { requireOwner } from "@/lib/auth";
import { getCompanies } from "@/lib/companies";
import { createClient } from "@/lib/supabase/server";

// What's still to come in Phase 1, in the order the spec builds it.
const NEXT_UP = [
  { title: "Live prices and company story cards", note: "Prices update on their own, and each company gets a page on what it sells and how it makes money." },
  { title: "Weekly brief", note: "Your week in plain English, here and in your inbox on Sunday evening." },
  { title: "Glossary", note: "Tap any term for a one-line explanation, with an example from your own companies." },
];

export default function Home() {
  return (
    <>
      <Suspense fallback={<GreetingSkeleton />}>
        <Greeting />
      </Suspense>

      <Suspense fallback={null}>
        <MyCompanies />
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
                <p className="text-prose text-ink-muted">{item.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-auto pt-12 text-body-sm text-ink-muted">
        This app explains; you decide. Nothing here is financial advice.
      </footer>
    </>
  );
}

// Greeting by Lagos time of day. Reads your settings, so it streams in after
// the rest of the page.
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
  if (error) console.error("settings:", error.message);

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
    <section className="flex flex-col gap-3 pt-8">
      <p className="eyebrow">{date}</p>
      <h1 className="text-heading-lg">{greeting}</h1>
    </section>
  );
}

// A card per company, holdings first, as the spec's dashboard describes.
async function MyCompanies() {
  const companies = await getCompanies();

  if (companies.length === 0) {
    return (
      <section className="mt-4 flex flex-col gap-6">
        <p className="text-prose text-ink-muted">
          Nothing to read yet. Start by adding the companies you own or are curious about.
        </p>
        <Link href="/companies/new" className="btn-primary text-center">
          Add your first company
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-10 flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow">My companies</h2>
        <Link href="/companies" className="link text-body-sm">
          See all
        </Link>
      </div>
      <ul className="border-t border-hairline">
        {companies.slice(0, 6).map((c) => (
          <CompanyRow key={c.id} company={c} />
        ))}
      </ul>
    </section>
  );
}

function GreetingSkeleton() {
  return (
    <section className="flex animate-pulse flex-col gap-3 pt-8" aria-hidden>
      <div className="h-5 w-40 rounded-sm bg-elevated" />
      <div className="h-11 w-56 rounded-sm bg-elevated" />
    </section>
  );
}
