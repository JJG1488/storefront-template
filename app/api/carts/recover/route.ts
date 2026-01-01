import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Recovery token required" },
        { status: 400 }
      );
    }

    // Find abandoned cart by recovery token
    const { data: cart, error } = await supabase
      .from("abandoned_carts")
      .select(`
        id,
        cart_items,
        cart_total,
        customer_id,
        recovered_at,
        order_id,
        customers (
          email,
          first_name
        )
      `)
      .eq("store_id", storeId)
      .eq("recovery_token", token)
      .single();

    if (error || !cart) {
      return NextResponse.json(
        { error: "Invalid or expired recovery link" },
        { status: 404 }
      );
    }

    // Check if cart was already recovered
    if (cart.recovered_at || cart.order_id) {
      return NextResponse.json(
        {
          error: "This cart has already been recovered",
          alreadyRecovered: true
        },
        { status: 410 } // Gone
      );
    }

    // Handle customers being returned as array from join
    type CustomerRow = { email: string; first_name: string | null };
    const customersData = cart.customers as unknown as CustomerRow[] | CustomerRow | null;
    const customerData = Array.isArray(customersData) ? customersData[0] : customersData;

    // Return cart items for restoration
    return NextResponse.json({
      success: true,
      cartItems: cart.cart_items,
      cartTotal: cart.cart_total,
      customerName: customerData?.first_name || null,
    });
  } catch (error) {
    console.error("Cart recovery error:", error);
    return NextResponse.json(
      { error: "Failed to recover cart" },
      { status: 500 }
    );
  }
}
