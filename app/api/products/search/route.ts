import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getStoreId, isBuildTime } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json({ products: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({ products: [] });
    }

    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ products: [] });
    }

    // Check if we should hide out of stock products
    let hideOutOfStock = false;
    const { data: settingsData } = await supabase
      .from("store_settings")
      .select("settings")
      .eq("store_id", storeId)
      .limit(1);

    if (settingsData?.[0]?.settings?.hideOutOfStock) {
      hideOutOfStock = true;
    }

    // Search by name or description using ilike for case-insensitive matching
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20); // Fetch more to allow for filtering

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json({ products: [] });
    }

    // Transform database products to Product interface
    let products = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: Math.round(p.price * 100), // Convert dollars to cents
      images: (p.images || []).map((img: unknown) =>
        typeof img === "string" ? img : (img as { url: string }).url
      ),
      track_inventory: p.track_inventory ?? false,
      inventory_count: p.inventory_count,
      is_digital: p.is_digital ?? false,
    }));

    // Filter out out-of-stock products if setting is enabled
    if (hideOutOfStock) {
      products = products.filter((p) => {
        // Digital products are never out of stock
        if (p.is_digital) return true;
        // Products not tracking inventory are always shown
        if (!p.track_inventory) return true;
        // Show products with stock > 0
        return (p.inventory_count ?? 0) > 0;
      });
    }

    // Limit to 10 results after filtering
    products = products.slice(0, 10);

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ products: [] });
  }
}
