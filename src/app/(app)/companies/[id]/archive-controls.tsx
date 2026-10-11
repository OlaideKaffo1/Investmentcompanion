"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { restoreCompany } from "../actions";

// A submit button that asks first. Used for "Stop following" and for
// deleting from the archive.
export function ConfirmButton({
  message,
  pendingLabel,
  className,
  children,
}: {
  message: string;
  pendingLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function RestoreForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(restoreCompany, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Restoring…" : "Follow again"}
      </button>
      {state.error && <p className="text-body-sm text-crimson">{state.error}</p>}
    </form>
  );
}
