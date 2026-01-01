import { NextRequest, NextResponse } from "next/server";
import { isBuildTime } from "@/lib/supabase";
import { validateGiftCard, formatGiftCardAmount } from "@/lib/gift-cards";

export const dynamic = "force-dynamic";

interface ValidationResult {
  valid: boolean;
  error?: string;
  giftCard?: {
    code: string;
    balance: number;
    balanceFormatted: string;
    applicableAmount: number;
    applicableAmountFormatted: string;
  };
}

// POST - Validate a gift card code
export async function POST(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json({ error: "Not available during build" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { code, cartTotal } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json<ValidationResult>({
        valid: false,
        error: "Gift card code is required",
      });
    }

    if (typeof cartTotal !== "number" || cartTotal < 0) {
      return NextResponse.json<ValidationResult>({
        valid: false,
        error: "Valid cart total is required",
      });
    }

    // Convert cart total to cents
    const cartTotalCents = Math.round(cartTotal * 100);

    // Validate gift card
    const result = await validateGiftCard(code);

    if (!result.valid) {
      return NextResponse.json<ValidationResult>({
        valid: false,
        error: result.error,
      });
    }

    const { giftCard } = result;

    // Calculate applicable amount (min of balance and cart total)
    const applicableAmount = Math.min(giftCard.currentBalance, cartTotalCents);

    return NextResponse.json<ValidationResult>({
      valid: true,
      giftCard: {
        code: giftCard.code,
        balance: giftCard.currentBalance / 100,
        balanceFormatted: formatGiftCardAmount(giftCard.currentBalance),
        applicableAmount: applicableAmount / 100,
        applicableAmountFormatted: formatGiftCardAmount(applicableAmount),
      },
    });
  } catch (error) {
    console.error("Gift card validation error:", error);
    return NextResponse.json<ValidationResult>({
      valid: false,
      error: "Failed to validate gift card",
    });
  }
}
