import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET - Public endpoint to fetch variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();
    const { id: productId } = await params;

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Verify product belongs to store and is active
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, has_variants, variant_options, price")
      .eq("id", productId)
      .eq("store_id", storeId)
      .eq("status", "active")
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If product doesn't have variants, return empty
    if (!product.has_variants) {
      return NextResponse.json({
        hasVariants: false,
        options: [],
        variants: []
      });
    }

    // Get active variants
    const { data: variants, error } = await supabase
      .from("product_variants")
      .select("id, name, sku, price_adjustment, inventory_count, track_inventory, options, is_active")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (error) {
      console.error("Variants fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 });
    }

    return NextResponse.json({
      hasVariants: true,
      options: product.variant_options || [],
      basePrice: product.price,
      variants: variants || [],
    });
  } catch (error) {
    console.error("Variants error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
