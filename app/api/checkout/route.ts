import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getProductAdmin } from "@/data/products";
import { getStoreConfig } from "@/lib/store";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

// Check for required env vars at startup
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("[Checkout] STRIPE_SECRET_KEY is not configured");
}

// Initialize Stripe with the platform's secret key
const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2023-10-16",
});

interface VariantInfo {
  id: string;
  name: string;
  sku?: string;
  price_adjustment: number;
  options: Record<string, string>;
}

interface CartItem {
  productId: string;
  quantity: number;
  variantId?: string | null;
  variantInfo?: VariantInfo | null;
}

interface StockIssue {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  requested: number;
  available: number;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

async function validateAndGetCoupon(code: string, cartTotalCents: number): Promise<{ valid: boolean; error?: string; coupon?: Coupon }> {
  const supabase = getSupabaseAdmin();
  const storeId = getStoreId();

  if (!supabase || !storeId) {
    return { valid: false, error: "Store not configured" };
  }

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("store_id", storeId)
    .ilike("code", code.trim())
    .eq("is_active", true)
    .single();

  if (error || !coupon) {
    return { valid: false, error: "Invalid coupon code" };
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
    return { valid: false, error: `Minimum order of $${(coupon.minimum_order_amount / 100).toFixed(2)} required` };
  }

  return { valid: true, coupon: coupon as Coupon };
}

async function incrementCouponUsage(couponId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  // Fetch current usage and increment
  const { data: coupon } = await supabase
    .from("coupons")
    .select("current_uses")
    .eq("id", couponId)
    .single();

  if (coupon) {
    await supabase
      .from("coupons")
      .update({ current_uses: (coupon.current_uses || 0) + 1 })
      .eq("id", couponId);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Check Stripe is configured
    if (!stripeSecretKey) {
      console.error("[Checkout] STRIPE_SECRET_KEY not configured");
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { items, couponCode } = body as { items: CartItem[]; couponCode?: string };
    const store = getStoreConfig();

    console.log("[Checkout] Processing checkout", {
      itemCount: items?.length,
      storeId: store.id,
      hasStripeAccount: !!store.stripeAccountId,
      couponCode: couponCode || null,
    });

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Build line items for Stripe Checkout and validate stock
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const stockIssues: StockIssue[] = [];
    let hasPhysicalItems = false; // Track if cart has any physical (non-digital) items

    for (const item of items) {
      const product = await getProductAdmin(item.productId);
      if (!product) {
        console.error("[Checkout] Product not found:", item.productId);
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      // Track if this is a physical product (needs shipping)
      if (!product.is_digital) {
        hasPhysicalItems = true;
      }

      // Calculate price with variant adjustment
      const variantPriceAdjustment = item.variantInfo?.price_adjustment || 0;
      const itemPrice = product.price + variantPriceAdjustment;

      // Check stock availability
      // For variants, check variant stock. For regular products, check product stock.
      if (item.variantId) {
        // Fetch variant from database to get current stock
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("inventory_count, track_inventory, name")
            .eq("id", item.variantId)
            .single();

          if (
            variant &&
            variant.track_inventory &&
            variant.inventory_count !== null &&
            variant.inventory_count < item.quantity
          ) {
            stockIssues.push({
              productId: product.id,
              variantId: item.variantId,
              productName: product.name,
              variantName: variant.name,
              requested: item.quantity,
              available: variant.inventory_count,
            });
          }
        }
      } else if (
        product.track_inventory &&
        product.inventory_count !== null &&
        product.inventory_count < item.quantity
      ) {
        stockIssues.push({
          productId: product.id,
          productName: product.name,
          requested: item.quantity,
          available: product.inventory_count,
        });
      }

      // Build product name with variant info
      const productName = item.variantInfo
        ? `${product.name} - ${item.variantInfo.name}`
        : product.name;

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: productName,
            description: product.description || undefined,
            images:
              product.images.length > 0 ? [product.images[0]] : undefined,
            metadata: {
              product_id: product.id,
              variant_id: item.variantId || "",
              variant_name: item.variantInfo?.name || "",
              is_digital: product.is_digital ? "true" : "false",
            },
          },
          unit_amount: itemPrice,
        },
        quantity: item.quantity,
      });
    }

    // If any stock issues, return them
    if (stockIssues.length > 0) {
      return NextResponse.json(
        {
          error: "Some items have insufficient stock",
          stockIssues,
        },
        { status: 409 }
      );
    }

    // Calculate cart total in cents for coupon validation
    let cartTotalCents = 0;
    for (const item of items) {
      const product = await getProductAdmin(item.productId);
      if (product) {
        const variantPriceAdjustment = item.variantInfo?.price_adjustment || 0;
        cartTotalCents += (product.price + variantPriceAdjustment) * item.quantity;
      }
    }

    // Validate and apply coupon if provided
    let validatedCoupon: Coupon | null = null;
    let stripeCouponId: string | null = null;

    if (couponCode) {
      const couponResult = await validateAndGetCoupon(couponCode, cartTotalCents);

      if (!couponResult.valid) {
        return NextResponse.json(
          { error: couponResult.error || "Invalid coupon code" },
          { status: 400 }
        );
      }

      validatedCoupon = couponResult.coupon!;

      // Create a Stripe coupon on-the-fly
      try {
        const stripeCoupon = await stripe.coupons.create({
          ...(validatedCoupon.discount_type === "percentage"
            ? { percent_off: validatedCoupon.discount_value }
            : { amount_off: validatedCoupon.discount_value, currency: "usd" }),
          duration: "once",
          name: validatedCoupon.code,
        });
        stripeCouponId = stripeCoupon.id;
        console.log("[Checkout] Created Stripe coupon:", stripeCouponId);
      } catch (couponError) {
        console.error("[Checkout] Failed to create Stripe coupon:", couponError);
        return NextResponse.json(
          { error: "Failed to apply coupon" },
          { status: 500 }
        );
      }
    }

    // Get the origin for success/cancel URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Create Stripe Checkout Session with destination charge
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        store_id: store.id,
        store_name: store.name,
        ...(validatedCoupon && {
          coupon_id: validatedCoupon.id,
          coupon_code: validatedCoupon.code,
        }),
      },
    };

    // Add discount if coupon is applied
    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
      console.log("[Checkout] Applying discount with coupon:", stripeCouponId);
    }

    // Add shipping address collection only if:
    // 1. Shipping is enabled for the store
    // 2. There are physical (non-digital) items in the cart
    if (hasPhysicalItems && store.shippingEnabled && store.shippingCountries.length > 0) {
      sessionParams.shipping_address_collection = {
        allowed_countries: store.shippingCountries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      };
      console.log("[Checkout] Adding shipping collection - cart has physical items");
    } else if (!hasPhysicalItems) {
      console.log("[Checkout] Skipping shipping collection - all items are digital");
    }

    // If the store has a connected Stripe account, use destination charges
    if (store.stripeAccountId) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: store.stripeAccountId,
        },
      };
    }

    console.log("[Checkout] Creating Stripe session with", lineItems.length, "items");
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log("[Checkout] Session created:", session.id);

    // Increment coupon usage after successful session creation
    if (validatedCoupon) {
      await incrementCouponUsage(validatedCoupon.id);
      console.log("[Checkout] Incremented usage for coupon:", validatedCoupon.code);
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Log detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error("[Checkout] Error:", errorMessage);
    console.error("[Checkout] Details:", errorDetails);

    // Return appropriate error message
    if (errorMessage.includes("api_key")) {
      return NextResponse.json(
        { error: "Payment system configuration error" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session", details: errorMessage },
      { status: 500 }
    );
  }
}
