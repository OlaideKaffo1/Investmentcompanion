"use client";

import { useFormStatus } from "react-dom";

// Removing also deletes the company's snapshot history, so ask first.
export function RemoveButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-body-sm text-crimson underline-offset-4 hover:underline"
      onClick={(e) => {
        if (!confirm(`Remove ${name}? Its weekly history will be deleted too.`)) e.preventDefault();
      }}
    >
      {pending ? "Removing…" : "Remove from my list"}
    </button>
  );
}
