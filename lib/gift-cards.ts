import { getSupabaseAdmin, getStoreId } from "./supabase";

// Fixed gift card denominations (in cents)
export const GIFT_CARD_AMOUNTS = [2500, 5000, 10000, 20000] as const;

// Format amount for display (e.g., 2500 -> "$25.00")
export function formatGiftCardAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Generate a unique gift card code (GC-XXXX-XXXX-XXXX)
// Uses crypto.getRandomValues() for cryptographically secure randomness
export function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing chars (0, O, 1, I)
  const segments = [];

  // Generate 12 random bytes (4 chars × 3 segments)
  const randomBytes = new Uint8Array(12);
  crypto.getRandomValues(randomBytes);

  let byteIndex = 0;
  for (let s = 0; s < 3; s++) {
    let segment = "";
    for (let i = 0; i < 4; i++) {
      // Use modulo to map byte value to character set
      // This is slightly biased but acceptable for 32-char set
      const randomIndex = randomBytes[byteIndex++] % chars.length;
      segment += chars[randomIndex];
    }
    segments.push(segment);
  }

  return `GC-${segments.join("-")}`;
}

// Format gift card code for display (uppercase, with dashes)
export function formatGiftCardCode(code: string): string {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 2) return clean;

  // If it starts with "GC", format as GC-XXXX-XXXX-XXXX
  if (clean.startsWith("GC")) {
    const rest = clean.slice(2);
    const parts = rest.match(/.{1,4}/g) || [];
    return `GC-${parts.join("-")}`;
  }

  // Otherwise just add dashes every 4 chars
  const parts = clean.match(/.{1,4}/g) || [];
  return parts.join("-");
}

// Validate and get gift card by code
export interface GiftCardInfo {
  id: string;
  code: string;
  originalAmount: number;
  currentBalance: number;
  status: "active" | "disabled" | "exhausted";
  recipientEmail: string;
  recipientName: string | null;
}

export async function validateGiftCard(
  code: string
): Promise<{ valid: false; error: string } | { valid: true; giftCard: GiftCardInfo }> {
  const supabase = getSupabaseAdmin();
  const storeId = getStoreId();

  if (!supabase || !storeId) {
    return { valid: false, error: "Service unavailable" };
  }

  // Normalize code - remove spaces and dashes, uppercase
  const normalizedCode = code.toUpperCase().replace(/[\s-]/g, "");

  // Reconstruct the standard format
  let formattedCode = normalizedCode;
  if (normalizedCode.startsWith("GC") && normalizedCode.length === 14) {
    formattedCode = `GC-${normalizedCode.slice(2, 6)}-${normalizedCode.slice(6, 10)}-${normalizedCode.slice(10, 14)}`;
  }

  const { data: giftCard, error } = await supabase
    .from("gift_cards")
    .select("id, code, original_amount, current_balance, status, recipient_email, recipient_name")
    .eq("store_id", storeId)
    .eq("code", formattedCode)
    .single();

  if (error || !giftCard) {
    return { valid: false, error: "Invalid gift card code" };
  }

  if (giftCard.status === "disabled") {
    return { valid: false, error: "This gift card has been disabled" };
  }

  if (giftCard.status === "exhausted" || giftCard.current_balance <= 0) {
    return { valid: false, error: "This gift card has no remaining balance" };
  }

  return {
    valid: true,
    giftCard: {
      id: giftCard.id,
      code: giftCard.code,
      originalAmount: giftCard.original_amount,
      currentBalance: giftCard.current_balance,
      status: giftCard.status as "active" | "disabled" | "exhausted",
      recipientEmail: giftCard.recipient_email,
      recipientName: giftCard.recipient_name,
    },
  };
}

// Redeem gift card (deduct amount and log transaction)
// Uses atomic update with WHERE clause to prevent race conditions
export async function redeemGiftCard(
  giftCardId: string,
  amount: number,
  orderId: string
): Promise<{ success: true; newBalance: number } | { success: false; error: string }> {
  const supabase = getSupabaseAdmin();
  const storeId = getStoreId();

  if (!supabase || !storeId) {
    return { success: false, error: "Service unavailable" };
  }

  // Use RPC function for atomic balance update with row-level locking
  // This prevents race conditions by checking and updating in a single transaction
  const { data: result, error: rpcError } = await supabase.rpc(
    "redeem_gift_card_atomic",
    {
      p_gift_card_id: giftCardId,
      p_store_id: storeId,
      p_amount: amount,
      p_order_id: orderId,
    }
  );

  if (rpcError) {
    console.error("Gift card redemption RPC error:", rpcError);

    // Fallback to non-atomic method if RPC doesn't exist
    if (rpcError.message.includes("does not exist")) {
      return redeemGiftCardFallback(supabase, storeId, giftCardId, amount, orderId);
    }

    return { success: false, error: "Failed to redeem gift card" };
  }

  if (!result || !result.success) {
    return { success: false, error: result?.error || "Failed to redeem gift card" };
  }

  return { success: true, newBalance: result.new_balance };
}

// Fallback for stores without the RPC function (uses optimistic locking)
async function redeemGiftCardFallback(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  storeId: string,
  giftCardId: string,
  amount: number,
  orderId: string
): Promise<{ success: true; newBalance: number } | { success: false; error: string }> {
  if (!supabase) {
    return { success: false, error: "Service unavailable" };
  }

  // Get current gift card state
  const { data: giftCard, error: fetchError } = await supabase
    .from("gift_cards")
    .select("id, current_balance, status, store_id")
    .eq("id", giftCardId)
    .single();

  if (fetchError || !giftCard) {
    return { success: false, error: "Gift card not found" };
  }

  if (giftCard.store_id !== storeId) {
    return { success: false, error: "Gift card not found" };
  }

  if (giftCard.status !== "active") {
    return { success: false, error: "Gift card is not active" };
  }

  if (giftCard.current_balance < amount) {
    return { success: false, error: "Insufficient gift card balance" };
  }

  const newBalance = giftCard.current_balance - amount;
  const newStatus = newBalance === 0 ? "exhausted" : "active";
  const previousBalance = giftCard.current_balance;

  // Atomic update with optimistic locking - only succeeds if balance hasn't changed
  const { data: updated, error: updateError } = await supabase
    .from("gift_cards")
    .update({
      current_balance: newBalance,
      status: newStatus,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", giftCardId)
    .eq("current_balance", previousBalance) // Optimistic lock
    .eq("status", "active")
    .select("id")
    .single();

  if (updateError || !updated) {
    // Balance changed between read and update - race condition detected
    return { success: false, error: "Gift card balance changed, please try again" };
  }

  // Create transaction record
  const { error: txError } = await supabase.from("gift_card_transactions").insert({
    gift_card_id: giftCardId,
    order_id: orderId,
    amount: amount,
    balance_before: previousBalance,
    balance_after: newBalance,
  });

  if (txError) {
    console.error("Failed to create gift card transaction:", txError);
    // Non-fatal - balance was already updated
  }

  return { success: true, newBalance };
}

// Create a new gift card (used by webhook and admin)
export interface CreateGiftCardInput {
  amount: number;
  purchasedByEmail: string;
  purchasedByName?: string;
  recipientEmail: string;
  recipientName?: string;
  giftMessage?: string;
  orderId?: string;
}

export async function createGiftCard(
  input: CreateGiftCardInput
): Promise<{ success: true; giftCard: { id: string; code: string } } | { success: false; error: string }> {
  const supabase = getSupabaseAdmin();
  const storeId = getStoreId();

  if (!supabase || !storeId) {
    return { success: false, error: "Service unavailable" };
  }

  const code = generateGiftCardCode();

  const { data, error } = await supabase
    .from("gift_cards")
    .insert({
      store_id: storeId,
      code,
      original_amount: input.amount,
      current_balance: input.amount,
      purchased_by_email: input.purchasedByEmail,
      purchased_by_name: input.purchasedByName || null,
      recipient_email: input.recipientEmail,
      recipient_name: input.recipientName || null,
      gift_message: input.giftMessage || null,
      order_id: input.orderId || null,
      status: "active",
    })
    .select("id, code")
    .single();

  if (error) {
    console.error("Failed to create gift card:", error);
    return { success: false, error: "Failed to create gift card" };
  }

  return { success: true, giftCard: { id: data.id, code: data.code } };
}

// Mark gift card email as sent
export async function markGiftCardEmailSent(giftCardId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  if (!supabase) return false;

  const { error } = await supabase
    .from("gift_cards")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", giftCardId);

  return !error;
}
