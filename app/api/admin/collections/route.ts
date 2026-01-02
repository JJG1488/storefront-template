import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId, isBuildTime } from "@/lib/supabase";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";

export const dynamic = "force-dynamic";

// GET - List all collections with product counts
export async function GET(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json({ collections: [] });
  }

  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Fetch collections with product count
    const { data: collections, error } = await supabase
      .from("collections")
      .select(`
        *,
        product_collections (count)
      `)
      .eq("store_id", storeId)
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

// POST - Create new collection
export async function POST(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json({ error: "Not available during build" }, { status: 400 });
  }

  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { name, description, imageUrl, isActive } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from("collections")
      .select("id")
      .eq("store_id", storeId)
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: "A collection with this name already exists" }, { status: 409 });
    }

    // Get max position
    const { data: maxPos } = await supabase
      .from("collections")
      .select("position")
      .eq("store_id", storeId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = (maxPos?.position || 0) + 1;

    // Create collection
    const { data: collection, error } = await supabase
      .from("collections")
      .insert({
        store_id: storeId,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        image_url: imageUrl || null,
        is_active: isActive !== false,
        position,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create collection:", error);
      return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Create collection error:", error);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
