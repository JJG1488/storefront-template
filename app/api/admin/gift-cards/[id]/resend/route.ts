import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";
import { sendGiftCardDelivery } from "@/lib/email";
import { markGiftCardEmailSent } from "@/lib/gift-cards";

export const dynamic = "force-dynamic";

// Verify admin token
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.split(" ")[1];
  const verifyRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/admin/verify`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return verifyRes.ok;
}

// POST - Resend gift card email to recipient
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const storeId = getStoreId();

  if (!supabase || !storeId) {
    return NextResponse.json({ error: "Store not configured" }, { status: 500 });
  }

  try {
    // Fetch gift card
    const { data: giftCard, error } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (error || !giftCard) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 });
    }

    // Send the email
    const emailSent = await sendGiftCardDelivery({
      recipientEmail: giftCard.recipient_email,
      recipientName: giftCard.recipient_name || undefined,
      senderName: giftCard.purchased_by_name || undefined,
      senderEmail: giftCard.purchased_by_email,
      amount: giftCard.original_amount,
      code: giftCard.code,
      giftMessage: giftCard.gift_message || undefined,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send email. Please check email configuration." },
        { status: 500 }
      );
    }

    // Update email_sent_at timestamp
    await markGiftCardEmailSent(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resend gift card email error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
