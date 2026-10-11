function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. See .env.example for the full list.`,
    );
  }
  return value;
}

// NEXT_PUBLIC_* values must be read with a literal `process.env.X` so Next.js
// can inline them into browser code.
export const supabaseUrl = () =>
  required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabaseKey = () =>
  required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

export function isAllowedEmail(email: string | null | undefined): boolean {
  const allowed = required("ALLOWED_EMAIL", process.env.ALLOWED_EMAIL);
  return !!email && email.trim().toLowerCase() === allowed.trim().toLowerCase();
}
