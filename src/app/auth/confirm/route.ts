import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { isAllowedEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// The sign-in email also carries a link, for when you're on a computer and
// would rather click than type the code. It lands here.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error && isAllowedEmail(data.user?.email)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (!error) await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
