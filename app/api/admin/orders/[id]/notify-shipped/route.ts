import { NextRequest, NextResponse } from "next/server";
import { activeTokens } from "../../../login/route";
import { getSupabase, getStoreId } from "@/lib/supabase";
import { sendShippingNotification } from "@/lib/email";

// Helper to verify auth
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return token ? activeTokens.has(token) : false;
}

// POST - Send shipping notification email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();
    const { id } = await params;

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Get order details
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get tracking URL if provided in request body
    const body = await request.json().catch(() => ({}));
    const trackingUrl = body.trackingUrl || null;

    // Send the shipping notification
    const success = await sendShippingNotification(
      order.customer_email,
      order.customer_name,
      order.id,
      order.tracking_number || undefined,
      trackingUrl || undefined
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to send notification. Check email configuration." },
        { status: 500 }
      );
    }

    // Update order status to shipped if not already
    if (order.status !== "shipped" && order.status !== "delivered") {
      await supabase
        .from("orders")
        .update({ status: "shipped" })
        .eq("id", id);
    }

    return NextResponse.json({ success: true, message: "Shipping notification sent" });
  } catch (error) {
    console.error("Notify shipped error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
