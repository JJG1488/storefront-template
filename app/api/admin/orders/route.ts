import { NextRequest, NextResponse } from "next/server";
import { activeTokens } from "@/lib/admin-tokens";
import { getSupabase, getStoreId } from "@/lib/supabase";

// Helper to verify auth
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return token ? activeTokens.has(token) : false;
}

// GET - List orders
export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    const status = request.nextUrl.searchParams.get("status");

    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price_at_time,
          product_name
        )
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    // Filter by status
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Orders fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Orders error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
