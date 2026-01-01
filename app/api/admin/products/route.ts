import { NextRequest, NextResponse } from "next/server";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";
import { getSupabaseAdmin, getStoreId, createFreshAdminClient } from "@/lib/supabase";
import { canAddProduct, getProductLimit } from "@/lib/products";
import { getFeatureFlags } from "@/hooks/useFeatureFlags";

// Helper function to generate URL-friendly slug from product name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

// GET - List products
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

    const filter = request.nextUrl.searchParams.get("filter");

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

    let query = supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    // Filter for low stock using configurable threshold
    if (filter === "low-stock") {
      query = query.lte("inventory_count", lowStockThreshold);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Products fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    // Include tier info for UI limit display
    const { tier, maxProducts, isUnlimitedProducts } = getFeatureFlags();
    const products = data || [];

    return NextResponse.json({
      products,
      tier: {
        name: tier,
        maxProducts: isUnlimitedProducts ? null : maxProducts,
        isUnlimited: isUnlimitedProducts,
        current: products.length,
        canAdd: canAddProduct(products.length),
      },
      lowStockThreshold,
    });
  } catch (error) {
    console.error("Products error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create product
export async function POST(request: NextRequest) {
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    // Detailed error checking for configuration issues
    if (!supabase) {
      console.error("Supabase client not initialized - check NEXT_PUBLIC_SUPABASE_URL");
      return NextResponse.json({
        error: "Database not configured",
        detail: "NEXT_PUBLIC_SUPABASE_URL may be missing"
      }, { status: 500 });
    }

    if (!storeId) {
      console.error("Store ID not configured - NEXT_PUBLIC_STORE_ID is empty or missing");
      return NextResponse.json({
        error: "Store not configured",
        detail: "NEXT_PUBLIC_STORE_ID is missing"
      }, { status: 500 });
    }

    // Check product limit for Starter tier (10 max)
    const { count: productCount, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId);

    if (countError) {
      console.error("Product count error:", countError);
    }

    const currentCount = productCount || 0;
    if (!canAddProduct(currentCount)) {
      const limit = getProductLimit();
      return NextResponse.json({
        error: "Product limit reached",
        detail: `You've reached your ${limit} product limit. Upgrade to Pro for unlimited products.`,
        limit,
        current: currentCount,
        upgrade: true
      }, { status: 403 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("products")
      .insert({
        store_id: storeId,
        name: body.name,
        slug: generateSlug(body.name),
        description: body.description || "",
        price: body.price || 0,
        images: body.images || [],
        status: body.status || "active",
        inventory_count: body.inventory_count ?? null,
        track_inventory: body.track_inventory ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error("Product create error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        storeId: storeId,
      });
      return NextResponse.json({
        error: "Failed to create product",
        detail: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Create error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
