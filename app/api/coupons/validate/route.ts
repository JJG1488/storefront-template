import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId, isBuildTime } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  coupon?: {
    code: string;
    description: string | null;
    discountType: "percentage" | "fixed";
    discountValue: number;
    discountAmount: number;
  };
}

function validateCoupon(coupon: Coupon, cartTotalCents: number): { valid: boolean; error?: string } {
  if (!coupon.is_active) {
    return { valid: false, error: "This coupon is not active" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: "This coupon has expired" };
  }

  if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
    return { valid: false, error: "This coupon is not yet valid" };
  }

  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
    return { valid: false, error: "This coupon has reached its usage limit" };
  }

  if (cartTotalCents < coupon.minimum_order_amount) {
    const minOrder = (coupon.minimum_order_amount / 100).toFixed(2);
    return { valid: false, error: `Minimum order of $${minOrder} required` };
  }

  return { valid: true };
}

function calculateDiscount(coupon: Coupon, cartTotalCents: number): number {
  if (coupon.discount_type === "percentage") {
    return Math.round((cartTotalCents * coupon.discount_value) / 100);
  }
  // Fixed amount - cap at cart total
  return Math.min(coupon.discount_value, cartTotalCents);
}

// POST - Validate a coupon code
export async function POST(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json({ error: "Not available during build" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { code, cartTotal } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    if (typeof cartTotal !== "number" || cartTotal < 0) {
      return NextResponse.json({ error: "Valid cart total is required" }, { status: 400 });
    }

    // Convert cart total to cents
    const cartTotalCents = Math.round(cartTotal * 100);

    // Look up coupon (case-insensitive)
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", storeId)
      .ilike("code", code.trim())
      .eq("is_active", true)
      .single();

    if (error || !coupon) {
      return NextResponse.json<ValidationResult>({
        valid: false,
        error: "Invalid coupon code",
      });
    }

    // Validate coupon
    const validation = validateCoupon(coupon as Coupon, cartTotalCents);
    if (!validation.valid) {
      return NextResponse.json<ValidationResult>(validation);
    }

    // Calculate discount
    const discountAmount = calculateDiscount(coupon as Coupon, cartTotalCents);

    return NextResponse.json<ValidationResult>({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        discountAmount: discountAmount / 100, // Return in dollars
      },
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
