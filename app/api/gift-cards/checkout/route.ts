import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStoreConfig } from "@/lib/store";
import { GIFT_CARD_AMOUNTS, formatGiftCardAmount } from "@/lib/gift-cards";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2023-10-16",
});

interface GiftCardCheckoutRequest {
  amount: number;
  recipientEmail: string;
  recipientName?: string | null;
  senderEmail: string;
  senderName?: string | null;
  giftMessage?: string | null;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const body = await request.json() as GiftCardCheckoutRequest;
    const { amount, recipientEmail, recipientName, senderEmail, senderName, giftMessage } = body;
    const store = getStoreConfig();

    // Validate amount is one of the allowed denominations
    if (!GIFT_CARD_AMOUNTS.includes(amount as typeof GIFT_CARD_AMOUNTS[number])) {
      return NextResponse.json(
        { error: "Invalid gift card amount" },
        { status: 400 }
      );
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: "Valid recipient email is required" },
        { status: 400 }
      );
    }

    if (!senderEmail || !emailRegex.test(senderEmail)) {
      return NextResponse.json(
        { error: "Valid sender email is required" },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Create Stripe Checkout Session for gift card purchase
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${store.name} Gift Card`,
              description: `${formatGiftCardAmount(amount)} digital gift card`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/gift-cards/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/gift-cards`,
      customer_email: senderEmail,
      metadata: {
        type: "gift_card",
        store_id: store.id,
        store_name: store.name,
        gift_card_amount: String(amount),
        recipient_email: recipientEmail,
        recipient_name: recipientName || "",
        sender_email: senderEmail,
        sender_name: senderName || "",
        gift_message: giftMessage || "",
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
    console.error("[Gift Card Checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
