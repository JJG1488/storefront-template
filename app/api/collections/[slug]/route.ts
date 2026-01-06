import { NextRequest, NextResponse } from "next/server";
import { createFreshAnonClient, getStoreId, isBuildTime } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET - Get collection by slug with products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (isBuildTime()) {
    return NextResponse.json({ error: "Not available during build" }, { status: 400 });
  }

  try {
    const { slug } = await params;
    // Use fresh client to bypass PostgREST caching
    const supabase = createFreshAnonClient();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Fetch collection
    const { data: collection, error } = await supabase
      .from("collections")
      .select("*")
      .eq("slug", slug)
      .eq("store_id", storeId)
      .eq("is_active", true)
      .single();

    if (error || !collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Fetch products in this collection
    const { data: productLinks } = await supabase
      .from("product_collections")
      .select(`
        product_id,
        position,
        products:product_id (
          id,
          name,
          slug,
          description,
          price,
          compare_at_price,
          images,
          status,
          track_inventory,
          inventory_count,
          is_digital,
          digital_file_url,
          has_variants
        )
      `)
      .eq("collection_id", collection.id)
      .order("position", { ascending: true });

    // Filter to only active products and transform images
    interface RawProductData {
      id: string;
      name: string;
      slug: string;
      description: string;
      price: number;
      compare_at_price: number | null;
      images: unknown[];
      status: string;
      track_inventory: boolean;
      inventory_count: number | null;
      is_digital: boolean;
      digital_file_url: string | null;
      has_variants: boolean;
    }

    const products = (productLinks || [])
      .map((link) => link.products as unknown as RawProductData | null)
      .filter((p): p is RawProductData => p !== null && p.status === "active")
      .map((p) => ({
        ...p,
        // Transform images: handle both string URLs and {url, alt, position} objects
        images: (p.images || []).map((img: unknown) =>
          typeof img === "string" ? img : (img as { url: string }).url
        ),
      }));

    return NextResponse.json({ collection, products });
  } catch (error) {
    console.error("Get collection error:", error);
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }
}
