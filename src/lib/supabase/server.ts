import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { supabaseKey, supabaseUrl } from "@/lib/env";

// A Supabase client for Server Components, Server Actions and Route Handlers.
// Create a new one per request; never share it between requests.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can't write cookies. That's fine: the proxy
          // refreshes the session cookie on every request.
        }
      },
    },
  });
}
