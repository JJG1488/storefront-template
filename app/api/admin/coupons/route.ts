import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId, isBuildTime } from "@/lib/supabase";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";

export const dynamic = "force-dynamic";

// GET - List all coupons
export async function GET(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json({ coupons: [] });
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

    const { data: coupons, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch coupons:", error);
      return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
    }

    return NextResponse.json({ coupons: coupons || [] });
  } catch (error) {
    console.error("Coupons list error:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

// POST - Create new coupon
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
    if (!code || typeof code !== "string" || code.trim().length < 3) {
      return NextResponse.json({ error: "Code must be at least 3 characters" }, { status: 400 });
    }

    if (!discountType || !["percentage", "fixed"].includes(discountType)) {
      return NextResponse.json({ error: "Invalid discount type" }, { status: 400 });
    }

    if (typeof discountValue !== "number" || discountValue <= 0) {
      return NextResponse.json({ error: "Discount value must be positive" }, { status: 400 });
    }

    if (discountType === "percentage" && discountValue > 100) {
      return NextResponse.json({ error: "Percentage cannot exceed 100%" }, { status: 400 });
    }

    // Check for duplicate code
    const { data: existing } = await supabase
      .from("coupons")
      .select("id")
      .eq("store_id", storeId)
      .ilike("code", code.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
    }

    // Create coupon
    const { data: coupon, error } = await supabase
      .from("coupons")
      .insert({
        store_id: storeId,
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        discount_type: discountType,
        discount_value: discountType === "fixed" ? Math.round(discountValue * 100) : discountValue, // Store fixed as cents
        minimum_order_amount: minimumOrderAmount ? Math.round(minimumOrderAmount * 100) : 0,
        max_uses: maxUses || null,
        starts_at: startsAt || null,
        expires_at: expiresAt || null,
        is_active: isActive !== false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create coupon:", error);
      return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
