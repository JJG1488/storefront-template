import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabase, getStoreId } from "@/lib/supabase";
import { sendOrderConfirmation, sendNewOrderAlert } from "@/lib/email";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

/**
 * Create order from Stripe checkout session (fallback if webhook fails)
 * This is called from the checkout success page to ensure orders are created
 * even if the Stripe webhook isn't configured.
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Store not configured" },
        { status: 500 }
      );
    }

    // Check if order already exists (webhook may have already created it)
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .single();

    if (existingOrder) {
      // Order already exists, just return success
      return NextResponse.json({
        success: true,
        orderId: existingOrder.id,
        alreadyExists: true,
      });
    }

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });

    // Only process if payment was successful
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Check for gift card purchase (handled separately)
    if (session.metadata?.type === "gift_card") {
      return NextResponse.json({
        success: true,
        isGiftCard: true,
      });
    }

    // Get customer details
    const customerEmail = session.customer_details?.email || "";
    const customerName = session.customer_details?.name || "";
    const customerId = session.metadata?.customer_id || null;

    // Get shipping address
    let shippingAddress: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    } = {};
    let shippingName = customerName;

    const savedAddressJson = session.metadata?.saved_address_json;
    if (savedAddressJson) {
      try {
        const savedAddr = JSON.parse(savedAddressJson);
        shippingAddress = {
          line1: savedAddr.line1,
          line2: savedAddr.line2 || undefined,
          city: savedAddr.city,
          state: savedAddr.state || undefined,
          postal_code: savedAddr.postal_code,
          country: savedAddr.country,
        };
        shippingName = `${savedAddr.first_name} ${savedAddr.last_name}`;
      } catch {
        // Fall back to Stripe address
      }
    }

    if (!shippingAddress.line1) {
      const stripeAddr = session.shipping_details?.address;
      shippingAddress = {
        line1: stripeAddr?.line1 || undefined,
        line2: stripeAddr?.line2 || undefined,
        city: stripeAddr?.city || undefined,
        state: stripeAddr?.state || undefined,
        postal_code: stripeAddr?.postal_code || undefined,
        country: stripeAddr?.country || undefined,
      };
    }

    // Calculate totals
    const subtotal = session.amount_subtotal || 0;
    const total = session.amount_total || 0;
    const tax = session.total_details?.amount_tax || 0;
    const shippingCost = session.total_details?.amount_shipping || 0;
    const discountAmount = session.total_details?.amount_discount || 0;
    const couponCode = session.metadata?.coupon_code || null;
    const currency = session.currency?.toUpperCase() || "USD";

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: storeId,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        customer_email: customerEmail,
        customer_name: shippingName || customerName,
        shipping_address: shippingAddress,
        customer_id: customerId || null,
        subtotal,
        total,
        tax,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        coupon_code: couponCode,
        currency,
        status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Failed to create order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Process line items
    const orderItems: Array<{
      product_name: string;
      quantity: number;
      price_at_time: number;
      is_digital?: boolean;
      download_url?: string;
    }> = [];

    const lineItems = session.line_items?.data || [];

    for (const item of lineItems) {
      const productData = item.price?.product as Stripe.Product;
      const productId = productData?.metadata?.product_id;
      const variantId = productData?.metadata?.variant_id || null;
      const variantName = productData?.metadata?.variant_name || null;
      const isDigital = productData?.metadata?.is_digital === "true";
      const quantity = item.quantity || 1;
      const productName = item.description || productData?.name || "Unknown Product";
      const priceAtTime = item.price?.unit_amount || 0;

      // Generate download token for digital products
      let downloadToken: string | null = null;
      if (isDigital && productId) {
        downloadToken = crypto.randomUUID();
      }

      const variantInfo = variantId && variantName
        ? { id: variantId, name: variantName }
        : null;

      // Create order item
      await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: productId || null,
        product_name: productName,
        variant_info: variantInfo,
        quantity,
        unit_price: priceAtTime,
        download_url: downloadToken,
        download_count: 0,
      });

      orderItems.push({
        product_name: productName,
        quantity,
        price_at_time: priceAtTime,
        is_digital: isDigital,
        download_url: downloadToken || undefined,
      });

      // Note: Inventory decrement is handled by webhook only to avoid double-decrement
      // If webhook runs, it decrements. If only this fallback runs, inventory won't decrease.
      // This is a trade-off to prevent overselling.
    }

    console.log("Order created via fallback:", order.id);

    // Send email notifications
    const hasDigitalItems = orderItems.some(item => item.is_digital);
    const orderDetails = {
      orderId: order.id,
      customerName,
      customerEmail,
      items: orderItems,
      subtotal,
      tax,
      shippingCost,
      discountAmount,
      couponCode,
      total,
      shippingAddress,
      hasDigitalItems,
    };

    // Send emails (fire and forget)
    sendOrderConfirmation(orderDetails).catch((err) => {
      console.error("Failed to send order confirmation:", err);
    });

    sendNewOrderAlert(orderDetails).catch((err) => {
      console.error("Failed to send new order alert:", err);
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      alreadyExists: false,
    });
  } catch (error) {
    console.error("Error creating order from session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
