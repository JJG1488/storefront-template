import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabase, getStoreId } from "@/lib/supabase";
import { sendOrderConfirmation, sendNewOrderAlert, sendLowStockAlert, sendGiftCardPurchaseConfirmation, sendGiftCardDelivery } from "@/lib/email";
import { createGiftCard, markGiftCardEmailSent, formatGiftCardAmount, redeemGiftCard } from "@/lib/gift-cards";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      console.error("Missing signature or webhook secret");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only process if payment is successful
      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }

      // Check if this is a gift card purchase
      if (session.metadata?.type === "gift_card") {
        await handleGiftCardPurchase(session);
      } else {
        await handleSuccessfulCheckout(session);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSuccessfulCheckout(session: Stripe.Checkout.Session) {
  const supabase = getSupabase();
  const storeId = getStoreId();

  if (!supabase || !storeId) {
    console.error("Store not configured");
    return;
  }

  // Check if order already exists (idempotency)
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .single();

  if (existingOrder) {
    console.log("Order already exists for session:", session.id);
    return;
  }

  // Retrieve line items from Stripe session
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

  // Get customer details from session
  const customerEmail = session.customer_details?.email || "";
  const customerName = session.customer_details?.name || "";

  // Check for saved address in metadata (from logged-in customer checkout)
  const customerId = session.metadata?.customer_id || null;
  const savedAddressJson = session.metadata?.saved_address_json;

  let shippingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  let shippingName = customerName;

  if (savedAddressJson) {
    // Use saved address from metadata (customer selected a saved address)
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
      // Use name from saved address
      shippingName = `${savedAddr.first_name} ${savedAddr.last_name}`;
      console.log("[Webhook] Using saved address for:", shippingName);
    } catch (e) {
      console.error("[Webhook] Failed to parse saved address:", e);
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
  } else {
    // Use Stripe-collected address (customer entered a new address)
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
  const tax = (session.total_details?.amount_tax || 0);
  const shippingCost = (session.total_details?.amount_shipping || 0);
  const discountAmount = (session.total_details?.amount_discount || 0);
  const couponCode = session.metadata?.coupon_code || null;
  const currency = session.currency?.toUpperCase() || "USD";

  // Create order (link to customer account if logged in)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_id: storeId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      customer_email: customerEmail,
      customer_name: shippingName || customerName,
      shipping_address: shippingAddress,
      // Link order to customer account if logged in
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
    return;
  }

  // Process line items - create order items and decrement inventory
  const orderItems: Array<{
    product_name: string;
    quantity: number;
    price_at_time: number;
    is_digital?: boolean;
    download_url?: string;
  }> = [];

  for (const item of lineItems.data) {
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

    // Build variant info for order item
    const variantInfo = variantId && variantName
      ? { id: variantId, name: variantName }
      : null;

    // Create order item
    const { data: orderItem } = await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: productId || null,
      product_name: productName,
      variant_info: variantInfo,
      quantity,
      unit_price: priceAtTime,
      download_url: downloadToken, // Store download token for digital products
      download_count: 0,
    }).select().single();

    orderItems.push({
      product_name: productName,
      quantity,
      price_at_time: priceAtTime,
      is_digital: isDigital,
      download_url: downloadToken || undefined,
    });

    // Decrement inventory for physical products
    if (productId && !isDigital) {
      if (variantId) {
        // Decrement variant inventory
        await decrementVariantInventory(supabase, variantId, quantity);
      } else {
        // Decrement product inventory
        await decrementInventory(supabase, productId, quantity);
      }
    }
  }

  console.log("Order created successfully:", order.id);

  // Check if order has any digital items
  const hasDigitalItems = orderItems.some(item => item.is_digital);

  // Send email notifications (fire and forget - don't block webhook response)
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
    shippingAddress: shippingAddress as {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    },
    hasDigitalItems, // Flag for email template
  };

  // Send order confirmation to customer
  sendOrderConfirmation(orderDetails).catch((err) => {
    console.error("Failed to send order confirmation:", err);
  });

  // Send new order alert to store owner
  sendNewOrderAlert(orderDetails).catch((err) => {
    console.error("Failed to send new order alert:", err);
  });

  // Mark any abandoned cart as recovered if customer was logged in
  if (customerId) {
    await markCartAsRecovered(supabase, storeId, customerId, order.id);
  }

  // Redeem gift card if one was used
  const giftCardId = session.metadata?.gift_card_id;
  const giftCardAmount = session.metadata?.gift_card_amount;
  if (giftCardId && giftCardAmount) {
    const amountToRedeem = parseInt(giftCardAmount, 10);
    if (amountToRedeem > 0) {
      const redeemResult = await redeemGiftCard(giftCardId, amountToRedeem, order.id);
      if (redeemResult.success) {
        console.log(`Gift card ${giftCardId} redeemed: ${amountToRedeem} cents, new balance: ${redeemResult.newBalance}`);
      } else {
        console.error(`Failed to redeem gift card ${giftCardId}:`, redeemResult.error);
      }
    }
  }
}

async function markCartAsRecovered(
  supabase: ReturnType<typeof getSupabase>,
  storeId: string,
  customerId: string,
  orderId: string
) {
  if (!supabase) return;

  try {
    // Find any active abandoned cart for this customer
    const { data: cart } = await supabase
      .from("abandoned_carts")
      .select("id")
      .eq("store_id", storeId)
      .eq("customer_id", customerId)
      .is("recovered_at", null)
      .is("order_id", null)
      .single();

    if (cart) {
      // Mark the cart as recovered
      await supabase
        .from("abandoned_carts")
        .update({
          recovered_at: new Date().toISOString(),
          order_id: orderId,
        })
        .eq("id", cart.id);

      console.log(`Abandoned cart ${cart.id} marked as recovered for order ${orderId}`);
    }
  } catch (error) {
    // Silently ignore errors (cart may not exist, which is fine)
    console.log("No abandoned cart to recover for customer:", customerId);
  }
}

async function decrementInventory(
  supabase: ReturnType<typeof getSupabase>,
  productId: string,
  quantity: number
) {
  if (!supabase) return;

  // Get current inventory and product name
  const { data: product } = await supabase
    .from("products")
    .select("name, inventory_count, track_inventory")
    .eq("id", productId)
    .single();

  if (!product || !product.track_inventory || product.inventory_count === null) {
    return; // No inventory tracking for this product
  }

  // Get low stock threshold from store settings (default to 5)
  const storeId = getStoreId();
  let lowStockThreshold = 5;
  let lowStockEmailsEnabled = true;

  if (storeId) {
    const { data: store } = await supabase
      .from("stores")
      .select("config")
      .eq("id", storeId)
      .single();

    if (store?.config) {
      lowStockThreshold = store.config.lowStockThreshold ?? 5;
      lowStockEmailsEnabled = store.config.lowStockEmailsEnabled ?? true;
    }
  }

  const oldCount = product.inventory_count;
  // Decrement inventory (don't go below 0)
  const newCount = Math.max(0, oldCount - quantity);

  await supabase
    .from("products")
    .update({ inventory_count: newCount })
    .eq("id", productId);

  console.log(
    `Inventory updated for product ${productId}: ${oldCount} -> ${newCount}`
  );

  // Check if inventory just crossed the low stock threshold
  // Only send alert if:
  // 1. Low stock emails are enabled
  // 2. Old count was above threshold
  // 3. New count is at or below threshold
  if (
    lowStockEmailsEnabled &&
    oldCount > lowStockThreshold &&
    newCount <= lowStockThreshold
  ) {
    console.log(`Low stock threshold crossed for ${product.name}: ${newCount} <= ${lowStockThreshold}`);
    await sendLowStockAlert({
      id: productId,
      name: product.name,
      currentStock: newCount,
      threshold: lowStockThreshold,
    });
  }
}

async function decrementVariantInventory(
  supabase: ReturnType<typeof getSupabase>,
  variantId: string,
  quantity: number
) {
  if (!supabase) return;

  // Get current variant inventory and product name for alerts
  const { data: variant } = await supabase
    .from("product_variants")
    .select("inventory_count, track_inventory, product_id")
    .eq("id", variantId)
    .single();

  if (!variant || !variant.track_inventory || variant.inventory_count === null) {
    return; // No inventory tracking for this variant
  }

  // Get product name for low stock alert
  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", variant.product_id)
    .single();

  // Get low stock threshold from store settings (default to 5)
  const storeId = getStoreId();
  let lowStockThreshold = 5;
  let lowStockEmailsEnabled = true;

  if (storeId) {
    const { data: store } = await supabase
      .from("stores")
      .select("config")
      .eq("id", storeId)
      .single();

    if (store?.config) {
      lowStockThreshold = store.config.lowStockThreshold ?? 5;
      lowStockEmailsEnabled = store.config.lowStockEmailsEnabled ?? true;
    }
  }

  const oldCount = variant.inventory_count;
  // Decrement inventory (don't go below 0)
  const newCount = Math.max(0, oldCount - quantity);

  await supabase
    .from("product_variants")
    .update({ inventory_count: newCount })
    .eq("id", variantId);

  console.log(
    `Variant inventory updated for ${variantId}: ${oldCount} -> ${newCount}`
  );

  // Check if inventory just crossed the low stock threshold
  if (
    lowStockEmailsEnabled &&
    oldCount > lowStockThreshold &&
    newCount <= lowStockThreshold &&
    product
  ) {
    console.log(`Low stock threshold crossed for variant ${variantId}: ${newCount} <= ${lowStockThreshold}`);
    await sendLowStockAlert({
      id: variantId,
      name: `${product.name} (Variant)`,
      currentStock: newCount,
      threshold: lowStockThreshold,
    });
  }
}

async function handleGiftCardPurchase(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata) {
    console.error("[Gift Card Webhook] No metadata in session");
    return;
  }

  const amount = parseInt(metadata.gift_card_amount || "0", 10);
  const recipientEmail = metadata.recipient_email;
  const recipientName = metadata.recipient_name || null;
  const senderEmail = metadata.sender_email;
  const senderName = metadata.sender_name || null;
  const giftMessage = metadata.gift_message || null;
  const storeName = metadata.store_name || "Store";

  if (!amount || !recipientEmail || !senderEmail) {
    console.error("[Gift Card Webhook] Missing required metadata", metadata);
    return;
  }

  console.log(`[Gift Card Webhook] Creating gift card: ${formatGiftCardAmount(amount)} for ${recipientEmail}`);

  // Create the gift card
  const result = await createGiftCard({
    amount,
    purchasedByEmail: senderEmail,
    purchasedByName: senderName || undefined,
    recipientEmail,
    recipientName: recipientName || undefined,
    giftMessage: giftMessage || undefined,
  });

  if (!result.success) {
    console.error("[Gift Card Webhook] Failed to create gift card:", result.error);
    return;
  }

  const { giftCard } = result;
  console.log(`[Gift Card Webhook] Gift card created: ${giftCard.code}`);

  // Send emails (fire and forget)

  // 1. Send confirmation to purchaser
  sendGiftCardPurchaseConfirmation({
    purchaserEmail: senderEmail,
    purchaserName: senderName || undefined,
    recipientEmail,
    recipientName: recipientName || undefined,
    amount,
    giftMessage: giftMessage || undefined,
  }).catch((err) => {
    console.error("[Gift Card Webhook] Failed to send purchase confirmation:", err);
  });

  // 2. Send gift card to recipient
  sendGiftCardDelivery({
    recipientEmail,
    recipientName: recipientName || undefined,
    senderName: senderName || undefined,
    senderEmail,
    amount,
    code: giftCard.code,
    giftMessage: giftMessage || undefined,
  }).then(async (success) => {
    if (success) {
      await markGiftCardEmailSent(giftCard.id);
      console.log(`[Gift Card Webhook] Delivery email sent to ${recipientEmail}`);
    }
  }).catch((err) => {
    console.error("[Gift Card Webhook] Failed to send gift card delivery:", err);
  });
}
