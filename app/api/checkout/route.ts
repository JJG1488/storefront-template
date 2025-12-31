import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getProductAdmin } from "@/data/products";
import { getStoreConfig } from "@/lib/store";

// Check for required env vars at startup
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("[Checkout] STRIPE_SECRET_KEY is not configured");
}

// Initialize Stripe with the platform's secret key
const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2023-10-16",
});

interface CartItem {
  productId: string;
  quantity: number;
}

interface StockIssue {
  productId: string;
  productName: string;
  requested: number;
  available: number;
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
    const { items } = body as { items: CartItem[] };
    const store = getStoreConfig();

    console.log("[Checkout] Processing checkout", {
      itemCount: items?.length,
      storeId: store.id,
      hasStripeAccount: !!store.stripeAccountId,
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

      // Check stock availability only when inventory tracking is enabled
      // (Digital products don't track inventory)
      if (
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

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images:
              product.images.length > 0 ? [product.images[0]] : undefined,
            metadata: {
              product_id: product.id, // For webhook to link to inventory
              is_digital: product.is_digital ? "true" : "false", // Track digital status for webhook
            },
          },
          unit_amount: product.price, // Already in cents
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
      },
    };

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
