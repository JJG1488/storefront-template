import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId, isBuildTime } from "@/lib/supabase";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";

export const dynamic = "force-dynamic";

// GET - Get single coupon
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

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (error || !coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Get coupon error:", error);
    return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 });
  }
}

// PUT - Update coupon
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
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maxUses,
      startsAt,
      expiresAt,
      isActive,
    } = body;

    // Validation
    if (code && (typeof code !== "string" || code.trim().length < 3)) {
      return NextResponse.json({ error: "Code must be at least 3 characters" }, { status: 400 });
    }

    if (discountType && !["percentage", "fixed"].includes(discountType)) {
      return NextResponse.json({ error: "Invalid discount type" }, { status: 400 });
    }

    if (discountValue !== undefined && (typeof discountValue !== "number" || discountValue <= 0)) {
      return NextResponse.json({ error: "Discount value must be positive" }, { status: 400 });
    }

    if (discountType === "percentage" && discountValue > 100) {
      return NextResponse.json({ error: "Percentage cannot exceed 100%" }, { status: 400 });
    }

    // Check for duplicate code (if changing)
    if (code) {
      const { data: existing } = await supabase
        .from("coupons")
        .select("id")
        .eq("store_id", storeId)
        .ilike("code", code.trim())
        .neq("id", id)
        .single();

      if (existing) {
        return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (discountType !== undefined) updates.discount_type = discountType;
    if (discountValue !== undefined) {
      updates.discount_value = discountType === "fixed" ? Math.round(discountValue * 100) : discountValue;
    }
    if (minimumOrderAmount !== undefined) {
      updates.minimum_order_amount = minimumOrderAmount ? Math.round(minimumOrderAmount * 100) : 0;
    }
    if (maxUses !== undefined) updates.max_uses = maxUses || null;
    if (startsAt !== undefined) updates.starts_at = startsAt || null;
    if (expiresAt !== undefined) updates.expires_at = expiresAt || null;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data: coupon, error } = await supabase
      .from("coupons")
      .update(updates)
      .eq("id", id)
      .eq("store_id", storeId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update coupon:", error);
      return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
    }

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Update coupon error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

// DELETE - Delete coupon
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

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", id)
      .eq("store_id", storeId);

    if (error) {
      console.error("Failed to delete coupon:", error);
      return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
