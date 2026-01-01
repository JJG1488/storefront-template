import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

  // Find session and get customer info
  const { data: sessions, error } = await supabase
    .from("customer_sessions")
    .select(`
      id,
      expires_at,
      customer:customers (
        id,
        email,
        first_name,
        last_name,
        store_id
      )
    `)
    .eq("token", token)
    .limit(1);

  if (error || !sessions || sessions.length === 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = sessions[0];
  // customer is returned as array from join, get first element
  const customerData = session.customer as unknown as Array<{
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    store_id: string;
  }>;
  const customer = Array.isArray(customerData) ? customerData[0] : customerData;

  // Verify this session belongs to the current store
  if (customer.store_id !== storeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if token has expired
  if (new Date(session.expires_at) < new Date()) {
    // Clean up expired token
    await supabase.from("customer_sessions").delete().eq("id", session.id);
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  return NextResponse.json({
    valid: true,
    customer: {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
    },
  });
}
