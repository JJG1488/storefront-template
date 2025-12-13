import { NextRequest, NextResponse } from "next/server";
import { activeTokens } from "@/lib/admin-tokens";
import { getSupabase, getStoreId } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  // Verify auth
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || !activeTokens.has(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Get product stats
    const { data: products } = await supabase
      .from("products")
      .select("id, inventory_count")
      .eq("store_id", storeId);

    const totalProducts = products?.length || 0;
    const lowStockProducts = products?.filter((p) =>
      p.inventory_count !== null && p.inventory_count <= 5
    ).length || 0;

    // Get order stats
    const { data: orders } = await supabase
      .from("orders")
      .select("id, status, total")
      .eq("store_id", storeId);

    const totalOrders = orders?.length || 0;
    const pendingOrders = orders?.filter((o) => o.status === "pending").length || 0;
    const revenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

    return NextResponse.json({
      totalProducts,
      lowStockProducts,
      totalOrders,
      pendingOrders,
      revenue,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
