import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseUrl } from "@/lib/env";

// Full-access client for scheduled jobs that run with nobody signed in.
// It bypasses row level security, so only use it in server code that has
// already checked the caller (e.g. the cron secret).
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing environment variable SUPABASE_SECRET_KEY.");
  }
  return createClient<Database>(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
