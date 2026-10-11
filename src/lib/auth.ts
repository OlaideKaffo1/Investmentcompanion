import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isAllowedEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type Owner = {
  id: string;
  email: string;
};

// The one place pages and actions ask "who is this?". The proxy already
// turns strangers away, but every data read checks again here, close to the
// data, so a gap in the proxy can't expose anything.
export async function requireOwner(): Promise<Owner> {
  // Who's signed in is only known per request (and checking the session reads
  // the clock), so never let this run while a page is being pre-built.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = claims?.email as string | undefined;

  if (!claims || !isAllowedEmail(email)) {
    redirect("/login");
  }
  return { id: claims.sub, email: email! };
}
