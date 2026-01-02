import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getStoreId, isBuildTime } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET - List all active collections for storefront
export async function GET(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json({ collections: [] });
  }

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Fetch active collections with product count
    const { data: collections, error } = await supabase
      .from("collections")
      .select(`
        id,
        name,
        slug,
        description,
        image_url,
        product_collections (count)
      `)
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to fetch collections:", error);
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }

    // Transform to include product_count
    const collectionsWithCount = (collections || []).map((c) => ({
      ...c,
      product_count: c.product_collections?.[0]?.count || 0,
      product_collections: undefined,
    }));

    return NextResponse.json({ collections: collectionsWithCount });
  } catch (error) {
    console.error("Collections list error:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
