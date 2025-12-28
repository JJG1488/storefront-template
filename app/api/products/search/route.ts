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

    // Search by name or description using ilike for case-insensitive matching
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json({ products: [] });
    }

    // Transform database products to Product interface
    const products = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: Math.round(p.price * 100), // Convert dollars to cents
      images: (p.images || []).map((img: unknown) =>
        typeof img === "string" ? img : (img as { url: string }).url
      ),
      track_inventory: p.track_inventory ?? false,
      inventory_count: p.inventory_count,
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ products: [] });
  }
}
