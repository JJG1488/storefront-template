import { NextResponse } from "next/server";
import { getSupabase, getStoreId, isBuildTime } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET - List all active collections for storefront
export async function GET() {
  const buildTime = isBuildTime();
  const storeId = getStoreId();
  const supabase = getSupabase();

  if (buildTime) {
    return NextResponse.json({ collections: [] });
  }

  try {
    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Fetch active collections
    const { data: collections, error } = await supabase
      .from("collections")
      .select(`
        id,
        name,
        slug,
        description,
        image_url
      `)
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to fetch collections:", error);
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }

    if (!collections || collections.length === 0) {
      return NextResponse.json({ collections: [] });
    }

    // Fetch all product_collections in a single query (fixes N+1 problem)
    const collectionIds = collections.map((c) => c.id);
    const { data: productCollections } = await supabase
      .from("product_collections")
      .select("collection_id")
      .in("collection_id", collectionIds);

    // Count products per collection locally
    const productCounts: Record<string, number> = {};
    for (const pc of productCollections || []) {
      productCounts[pc.collection_id] = (productCounts[pc.collection_id] || 0) + 1;
    }

    // Add counts to collections
    const collectionsWithCount = collections.map((c) => ({
      ...c,
      product_count: productCounts[c.id] || 0,
    }));

    return NextResponse.json({ collections: collectionsWithCount });
  } catch (error) {
    console.error("Collections list error:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
