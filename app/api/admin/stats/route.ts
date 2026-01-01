import { NextRequest, NextResponse } from "next/server";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";
import { getSupabaseAdmin, getStoreId, createFreshAdminClient } from "@/lib/supabase";

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

    // Fetch low stock threshold from settings
    let lowStockThreshold = 5;
    const freshClient = createFreshAdminClient();
    if (freshClient) {
      const { data: settingsData } = await freshClient
        .from("store_settings")
        .select("settings")
        .eq("store_id", storeId)
        .limit(1);
      if (settingsData?.[0]?.settings?.lowStockThreshold !== undefined) {
        lowStockThreshold = settingsData[0].settings.lowStockThreshold;
      }
    }

    // Get product stats
    const { data: products } = await supabase
      .from("products")
      .select("id, inventory_count")
      .eq("store_id", storeId);

    const totalProducts = products?.length || 0;
    const lowStockProducts = products?.filter((p) =>
      p.inventory_count !== null && p.inventory_count <= lowStockThreshold
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
