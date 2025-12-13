import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getProduct } from "@/data/products";
import { getStoreConfig } from "@/lib/store";

// Initialize Stripe with the platform's secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
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
    const body = await request.json();
    const { items } = body as { items: CartItem[] };
    const store = getStoreConfig();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Build line items for Stripe Checkout and validate stock
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const stockIssues: StockIssue[] = [];

    for (const item of items) {
      const product = await getProduct(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      // Check stock availability only when inventory tracking is enabled
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

    // If the store has a connected Stripe account, use destination charges
    if (store.stripeAccountId) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: store.stripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
