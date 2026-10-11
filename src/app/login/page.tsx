import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Investing Companion</h1>
        <p className="text-muted">
          A private app. Sign in with the code we email you.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
