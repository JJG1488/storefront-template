import { NextRequest, NextResponse } from "next/server";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

// GET - Get single product
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
    const { id } = await params;

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT - Update product
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
    const { id } = await params;

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("products")
      .update({
        name: body.name,
        description: body.description,
        price: body.price,
        images: body.images,
        status: body.status,
        inventory_count: body.inventory_count,
        track_inventory: body.track_inventory,
        has_variants: body.has_variants ?? false,
        variant_options: body.variant_options ?? [],
      })
      .eq("id", id)
      .eq("store_id", storeId)
      .select()
      .single();

    if (error) {
      console.error("Product update error:", error);
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();
    const { id } = await params;

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("store_id", storeId);

    if (error) {
      console.error("Product delete error:", error);
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
