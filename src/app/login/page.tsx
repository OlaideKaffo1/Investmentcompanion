import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-10 px-6 py-12">
      <div className="flex flex-col gap-3">
        <p className="eyebrow">Private</p>
        <h1 className="text-heading-lg">Investing Companion</h1>
        <p className="text-prose text-ink-muted">
          The companies and markets you follow, in plain English.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
