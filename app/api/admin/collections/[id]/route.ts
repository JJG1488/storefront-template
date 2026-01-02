import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId, isBuildTime } from "@/lib/supabase";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";

export const dynamic = "force-dynamic";

// GET - Get single collection with products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isBuildTime()) {
    return NextResponse.json({ error: "Not available during build" }, { status: 400 });
  }

  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Fetch collection
    const { data: collection, error } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
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
          price,
          images,
          status
        )
      `)
      .eq("collection_id", id)
      .order("position", { ascending: true });

    const products = (productLinks || [])
      .map((link) => link.products)
      .filter(Boolean);

    return NextResponse.json({ collection, products });
  } catch (error) {
    console.error("Get collection error:", error);
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }
}

// PUT - Update collection
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isBuildTime()) {
    return NextResponse.json({ error: "Not available during build" }, { status: 400 });
  }

  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { name, description, imageUrl, isActive, productIds } = body;

    // Verify collection belongs to store
    const { data: existing } = await supabase
      .from("collections")
      .select("id, slug")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length < 1) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      updates.name = name.trim();

      // Update slug if name changed
      const newSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      // Check for slug conflict (excluding current collection)
      const { data: slugConflict } = await supabase
        .from("collections")
        .select("id")
        .eq("store_id", storeId)
        .eq("slug", newSlug)
        .neq("id", id)
        .single();

      if (slugConflict) {
        return NextResponse.json({ error: "A collection with this name already exists" }, { status: 409 });
      }

      updates.slug = newSlug;
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (imageUrl !== undefined) {
      updates.image_url = imageUrl || null;
    }

    if (isActive !== undefined) {
      updates.is_active = isActive;
    }

    // Update collection
    const { data: collection, error } = await supabase
      .from("collections")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update collection:", error);
      return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
    }

    // Update product associations if provided
    if (productIds !== undefined && Array.isArray(productIds)) {
      // Remove existing associations
      await supabase
        .from("product_collections")
        .delete()
        .eq("collection_id", id);

      // Add new associations
      if (productIds.length > 0) {
        const insertData = productIds.map((productId: string, index: number) => ({
          product_id: productId,
          collection_id: id,
          position: index,
        }));

        const { error: linkError } = await supabase
          .from("product_collections")
          .insert(insertData);

        if (linkError) {
          console.error("Failed to update product associations:", linkError);
        }
      }
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Update collection error:", error);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

// DELETE - Delete collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isBuildTime()) {
    return NextResponse.json({ error: "Not available during build" }, { status: 400 });
  }

  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Verify collection belongs to store
    const { data: existing } = await supabase
      .from("collections")
      .select("id")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Delete collection (product_collections will cascade)
    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete collection:", error);
      return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete collection error:", error);
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
