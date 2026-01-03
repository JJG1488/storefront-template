import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getStoreId, isBuildTime } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET - List all active collections for storefront
export async function GET(request: NextRequest) {
  // Debug: Check if we're in build time
  const buildTime = isBuildTime();
  const storeId = getStoreId();
  const supabase = getSupabase();

  // Return debug info if ?debug=1 is passed
  if (request.nextUrl.searchParams.get("debug") === "1") {
    return NextResponse.json({
      debug: true,
      isBuildTime: buildTime,
      hasStoreId: !!storeId,
      storeId: storeId || "EMPTY",
      hasSupabase: !!supabase,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET",
    });
  }

  if (buildTime) {
    return NextResponse.json({ collections: [] });
  }

  try {
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

    // Debug: Return raw query result if ?debug=2
    if (request.nextUrl.searchParams.get("debug") === "2") {
      return NextResponse.json({
        debug: true,
        storeId,
        rawCollections: collections,
        error: error ? { message: error.message, code: error.code, details: error.details } : null,
        count: collections?.length || 0,
      });
    }

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
