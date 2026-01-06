import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";
import { sendGiftCardDelivery } from "@/lib/email";
import { markGiftCardEmailSent, generateGiftCardCode } from "@/lib/gift-cards";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";

export const dynamic = "force-dynamic";

// GET - List all gift cards
export async function GET(request: NextRequest) {
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const storeId = getStoreId();

  if (!supabase || !storeId) {
    return NextResponse.json({ error: "Store not configured" }, { status: 500 });
  }

  const { data: giftCards, error } = await supabase
    .from("gift_cards")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch gift cards:", error);
    return NextResponse.json({ error: "Failed to fetch gift cards" }, { status: 500 });
  }

  return NextResponse.json({ giftCards });
}

// POST - Create a new gift card (manual issuance)
export async function POST(request: NextRequest) {
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const storeId = getStoreId();

  if (!supabase || !storeId) {
    return NextResponse.json({ error: "Store not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { amount, recipientEmail, recipientName, note, sendEmail } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    // Generate gift card code using cryptographically secure function
    const code = generateGiftCardCode();

    const { data: giftCard, error } = await supabase
      .from("gift_cards")
      .insert({
        store_id: storeId,
        code,
        original_amount: amount,
        current_balance: amount,
        purchased_by_email: "admin@store.local",
        purchased_by_name: "Store Admin",
        recipient_email: recipientEmail,
        recipient_name: recipientName || null,
        gift_message: note || "Issued by store admin",
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create gift card:", error);
      return NextResponse.json({ error: "Failed to create gift card" }, { status: 500 });
    }

    // Send email to recipient if requested
    if (sendEmail && giftCard) {
      const emailSent = await sendGiftCardDelivery({
        recipientEmail: giftCard.recipient_email,
        recipientName: giftCard.recipient_name || undefined,
        senderName: "Store Admin",
        senderEmail: "admin@store.local",
        amount: giftCard.original_amount,
        code: giftCard.code,
        giftMessage: note || undefined,
      });

      if (emailSent) {
        await markGiftCardEmailSent(giftCard.id);
      }
    }

    return NextResponse.json({ giftCard });
  } catch (err) {
    console.error("Gift card creation error:", err);
    return NextResponse.json({ error: "Failed to create gift card" }, { status: 500 });
  }
}
