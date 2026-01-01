import { NextRequest, NextResponse } from "next/server";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface VariantInput {
  id?: string;
  name: string;
  sku?: string;
  price_adjustment: number;
  inventory_count: number;
  track_inventory: boolean;
  options: Record<string, string>;
  position: number;
  is_active: boolean;
}

// GET - List variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();
    const { id: productId } = await params;

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Verify product belongs to store
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("store_id", storeId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get variants
    const { data: variants, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Variants fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 });
    }

    return NextResponse.json({ variants: variants || [] });
  } catch (error) {
    console.error("Variants error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create a new variant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();
    const { id: productId } = await params;

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Verify product belongs to store
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("store_id", storeId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body: VariantInput = await request.json();

    const { data, error } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        name: body.name,
        sku: body.sku || null,
        price_adjustment: body.price_adjustment || 0,
        inventory_count: body.inventory_count || 0,
        track_inventory: body.track_inventory ?? true,
        options: body.options || {},
        position: body.position || 0,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Variant create error:", error);
      return NextResponse.json({ error: "Failed to create variant" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Create variant error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT - Bulk update/replace all variants for a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();
    const { id: productId } = await params;

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Verify product belongs to store
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("store_id", storeId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body: { variants: VariantInput[] } = await request.json();
    const variants = body.variants || [];

    // Get existing variant IDs
    const { data: existingVariants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);

    const existingIds = (existingVariants || []).map((v) => v.id);
    const incomingIds = new Set(variants.filter((v) => v.id).map((v) => v.id));

    // Delete variants that are no longer present
    const toDelete = existingIds.filter((id) => !incomingIds.has(id));
    if (toDelete.length > 0) {
      await supabase
        .from("product_variants")
        .delete()
        .in("id", toDelete);
    }

    // Upsert variants
    const results = [];
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const variantData = {
        product_id: productId,
        name: variant.name,
        sku: variant.sku || null,
        price_adjustment: variant.price_adjustment || 0,
        inventory_count: variant.inventory_count || 0,
        track_inventory: variant.track_inventory ?? true,
        options: variant.options || {},
        position: i,
        is_active: variant.is_active ?? true,
      };

      if (variant.id) {
        // Update existing
        const { data, error } = await supabase
          .from("product_variants")
          .update(variantData)
          .eq("id", variant.id)
          .select()
          .single();

        if (!error && data) results.push(data);
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("product_variants")
          .insert(variantData)
          .select()
          .single();

        if (!error && data) results.push(data);
      }
    }

    return NextResponse.json({ variants: results });
  } catch (error) {
    console.error("Bulk update variants error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
