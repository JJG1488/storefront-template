import { NextRequest, NextResponse } from "next/server";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

// Valid order status values
const VALID_ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

type OrderStatus = typeof VALID_ORDER_STATUSES[number];

function isValidOrderStatus(status: string): status is OrderStatus {
  return VALID_ORDER_STATUSES.includes(status as OrderStatus);
}

// GET - List orders
export async function GET(request: NextRequest) {
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    const statusParam = request.nextUrl.searchParams.get("status");

    // Validate status parameter against allowed values
    if (statusParam && !isValidOrderStatus(statusParam)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          product_name
        )
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    // Filter by validated status
    if (statusParam) {
      query = query.eq("status", statusParam);
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
