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

    // Fetch active collections (without JOIN to avoid RLS/PostgREST cache issues)
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

    // Debug: Return raw query result if ?debug=2
    if (request.nextUrl.searchParams.get("debug") === "2") {
      return NextResponse.json({
        debug: true,
        storeId,
        rawCollections: collections,
        error: error ? { message: error.message, code: error.code, details: error.details } : null,
        count: collections?.length || 0,
        supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
      });
    }

    if (error) {
      console.error("Failed to fetch collections:", error);
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }

    // Fetch product counts separately to avoid JOIN issues
    const collectionsWithCount = await Promise.all(
      (collections || []).map(async (c) => {
        const { count } = await supabase
          .from("product_collections")
          .select("*", { count: "exact", head: true })
          .eq("collection_id", c.id);
        return {
          ...c,
          product_count: count || 0,
        };
      })
    );

    return NextResponse.json({ collections: collectionsWithCount });
  } catch (error) {
    console.error("Collections list error:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
