import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Helper to get customer from token
async function getCustomerFromToken(
  token: string,
  supabase: ReturnType<typeof getSupabaseAdmin>,
  storeId: string
) {
  if (!supabase) return null;

  const { data: sessions } = await supabase
    .from("customer_sessions")
    .select(
      `
      id,
      expires_at,
      customer:customers (
        id,
        email,
        store_id
      )
    `
    )
    .eq("token", token)
    .limit(1);

  if (!sessions || sessions.length === 0) return null;

  const session = sessions[0];
  // customer is returned as array from join, get first element
  const customerData = session.customer as unknown as Array<{
    id: string;
    email: string;
    store_id: string;
  }>;
  const customer = Array.isArray(customerData) ? customerData[0] : customerData;

  // Verify session is for this store and not expired
  if (customer.store_id !== storeId) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  return customer;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const customer = await getCustomerFromToken(token, supabase, storeId);
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get orders for this customer
    // Match by customer_id (if logged in when ordered) OR customer_email
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        payment_status,
        fulfillment_status,
        subtotal,
        shipping_cost,
        tax_amount,
        discount_amount,
        coupon_code,
        total,
        tracking_number,
        tracking_url,
        shipped_at,
        created_at,
        order_items (
          id,
          product_name,
          product_image,
          variant_info,
          quantity,
          unit_price,
          total_price
        )
      `
      )
      .eq("store_id", storeId)
      .or(`customer_id.eq.${customer.id},customer_email.ilike.${customer.email}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
