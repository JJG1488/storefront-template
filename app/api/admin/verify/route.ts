import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const storeId = getStoreId();

  if (!supabase || !storeId) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Check if token exists and is not expired
  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("id, expires_at")
    .eq("store_id", storeId)
    .eq("token", token)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if token has expired
  if (new Date(session.expires_at) < new Date()) {
    // Clean up expired token
    await supabase
      .from("admin_sessions")
      .delete()
      .eq("id", session.id);

    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}
