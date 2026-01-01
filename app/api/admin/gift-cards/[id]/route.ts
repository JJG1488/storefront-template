import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

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

// GET - Get a single gift card with transactions
export async function GET(
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

  // Fetch gift card
  const { data: giftCard, error: gcError } = await supabase
    .from("gift_cards")
    .select("*")
    .eq("id", id)
    .eq("store_id", storeId)
    .single();

  if (gcError || !giftCard) {
    return NextResponse.json({ error: "Gift card not found" }, { status: 404 });
  }

  // Fetch transactions
  const { data: transactions, error: txError } = await supabase
    .from("gift_card_transactions")
    .select("*")
    .eq("gift_card_id", id)
    .order("created_at", { ascending: false });

  if (txError) {
    console.error("Failed to fetch transactions:", txError);
  }

  return NextResponse.json({
    giftCard,
    transactions: transactions || [],
  });
}

// PATCH - Update gift card status
export async function PATCH(
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
    const body = await request.json();
    const { status } = body;

    if (!status || !["active", "disabled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify gift card belongs to this store
    const { data: existing } = await supabase
      .from("gift_cards")
      .select("id, status, current_balance")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 });
    }

    // Don't allow enabling exhausted cards
    if (status === "active" && existing.current_balance === 0) {
      return NextResponse.json(
        { error: "Cannot enable an exhausted gift card" },
        { status: 400 }
      );
    }

    const { data: giftCard, error } = await supabase
      .from("gift_cards")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("store_id", storeId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update gift card:", error);
      return NextResponse.json({ error: "Failed to update gift card" }, { status: 500 });
    }

    return NextResponse.json({ giftCard });
  } catch (err) {
    console.error("Gift card update error:", err);
    return NextResponse.json({ error: "Failed to update gift card" }, { status: 500 });
  }
}
