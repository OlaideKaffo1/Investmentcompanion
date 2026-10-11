import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { takeSnapshot } from "@/lib/snapshots";

// Vercel calls this every Sunday (see vercel.json) with
// "Authorization: Bearer <CRON_SECRET>". Anyone else gets a 401.
export async function GET(request: NextRequest) {
  if (!authorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("companies").select("user_id").is("archived_at", null);
  if (error) {
    console.error("snapshot: couldn't list companies", error.message);
    return NextResponse.json({ error: "database" }, { status: 500 });
  }

  const results = [];
  for (const userId of new Set(data.map((c) => c.user_id))) {
    results.push(await takeSnapshot(supabase, userId));
  }
  return NextResponse.json({ ok: true, results });
}

function authorized(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
