import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";
import { sendCartRecoveryEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const verifyRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/admin/verify`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!verifyRes.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { id } = await params;

    // Fetch the abandoned cart with customer info
    const { data: cart, error } = await supabase
      .from("abandoned_carts")
      .select(`
        id,
        cart_items,
        cart_total,
        recovery_token,
        recovery_email_sent_at,
        recovered_at,
        order_id,
        customers (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (error || !cart) {
      return NextResponse.json(
        { error: "Abandoned cart not found" },
        { status: 404 }
      );
    }

    // Check if cart was already recovered
    if (cart.recovered_at || cart.order_id) {
      return NextResponse.json(
        { error: "This cart has already been recovered" },
        { status: 400 }
      );
    }

    // Handle customers being returned as array from join
    type CustomerRow = { id: string; email: string; first_name: string | null; last_name: string | null };
    const customersData = cart.customers as unknown as CustomerRow[] | CustomerRow | null;
    const customerData = Array.isArray(customersData) ? customersData[0] : customersData;

    if (!customerData?.email) {
      return NextResponse.json(
        { error: "Customer email not found" },
        { status: 400 }
      );
    }

    // Build customer name
    const customerName = customerData.first_name
      ? `${customerData.first_name}${customerData.last_name ? ` ${customerData.last_name}` : ""}`
      : "there";

    // Build recovery URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const recoveryUrl = `${baseUrl}/recover-cart?token=${cart.recovery_token}`;

    // Parse cart items
    const cartItems = cart.cart_items as Array<{
      product_id: string;
      product_name: string;
      product_price: number;
      product_image: string | null;
      quantity: number;
      variant: {
        id: string;
        name: string;
        options: Record<string, string>;
        price_adjustment: number;
      } | null;
    }>;

    // Send recovery email
    const emailSent = await sendCartRecoveryEmail({
      customerEmail: customerData.email,
      customerName,
      cartItems: cartItems.map((item) => ({
        name: item.product_name,
        price: item.product_price + (item.variant?.price_adjustment || 0),
        quantity: item.quantity,
        image: item.product_image,
        variantName: item.variant?.name,
      })),
      cartTotal: cart.cart_total,
      recoveryUrl,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send recovery email" },
        { status: 500 }
      );
    }

    // Update cart with email sent timestamp
    await supabase
      .from("abandoned_carts")
      .update({ recovery_email_sent_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      message: "Recovery email sent",
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Send recovery email error:", error);
    return NextResponse.json(
      { error: "Failed to send recovery email" },
      { status: 500 }
    );
  }
}
