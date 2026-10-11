import type { Metadata } from "next";
import { Suspense } from "react";
import { requireOwner } from "@/lib/auth";
import { signOut } from "../../login/actions";

export const metadata: Metadata = { title: "Settings" };

// Things you rarely need, kept off the everyday screens. Alert switches and
// this month's API spend join this page in later steps.
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 pt-8">
      <h1 className="text-heading-lg">Settings</h1>
      <section className="flex flex-col gap-3">
        <h2 className="eyebrow">Account</h2>
        <Suspense fallback={<div className="card h-20 animate-pulse" />}>
          <Account />
        </Suspense>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="eyebrow">About</h2>
        <p className="text-body-sm text-ink-muted">
          This app explains; you decide. Nothing here is financial advice. Prices may be
          delayed, and anything written by AI can be wrong, so check the source before you act.
        </p>
      </section>
    </div>
  );
}

async function Account() {
  const owner = await requireOwner();
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-body-sm text-ink-muted">Signed in as</span>
        <span className="truncate">{owner.email}</span>
      </div>
      <form action={signOut}>
        <button type="submit" className="btn-secondary">
          Sign out
        </button>
      </form>
    </div>
  );
}
