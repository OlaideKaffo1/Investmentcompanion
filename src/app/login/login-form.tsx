"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initial: LoginState = { step: "email", email: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  if (state.step === "code") {
    return (
      <div className="flex flex-col gap-4">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="intent" value="verify" />
          <input type="hidden" name="email" value={state.email} />
          <p className="text-body-sm text-ink-muted">
            {state.message ?? "Enter the code we emailed you."}
          </p>
          <label className="flex flex-col gap-2">
            <span className="eyebrow">Sign-in code</span>
            <input
              key="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              required
              autoFocus
              className="field figures text-center font-mono text-heading-sm tracking-[0.3em]"
            />
          </label>
          {state.error && <p className="text-body-sm text-crimson">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Checking…" : "Sign in"}
          </button>
        </form>
        <form action={action}>
          <input type="hidden" name="intent" value="send" />
          <input type="hidden" name="email" value={state.email} />
          <button
            type="submit"
            disabled={pending}
            className="btn-ghost w-full"
          >
            Send a new code
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="intent" value="send" />
      <label className="flex flex-col gap-2">
        <span className="eyebrow">Email</span>
        <input
          key="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state.email}
          required
          autoFocus
          className="field"
          placeholder="you@example.com"
        />
      </label>
      {state.error && <p className="text-body-sm text-crimson">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Sending…" : "Email me a sign-in code"}
      </button>
    </form>
  );
}
