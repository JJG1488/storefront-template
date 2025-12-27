import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";
import { sendPasswordResetEmail } from "@/lib/email";

// Rate limiting: max 3 reset requests per hour
const MAX_RESET_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SUPPORT_EMAIL = "info@gosovereign.io";

export async function POST(request: NextRequest) {
  try {
    const storeId = getStoreId();
    const ownerEmail = process.env.STORE_OWNER_EMAIL;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store not configured" },
        { status: 500 }
      );
    }

    if (!ownerEmail) {
      return NextResponse.json(
        { error: "Store owner email not configured. Please contact support at " + SUPPORT_EMAIL },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Check rate limiting - get current reset attempt data
    const { data: store, error: fetchError } = await supabase
      .from("stores")
      .select("password_reset_attempts, password_reset_window_start")
      .eq("id", storeId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch store for rate limiting:", fetchError);
      // Continue anyway - don't block reset if rate limit check fails
    }

    const now = Date.now();
    let attempts = store?.password_reset_attempts || 0;
    let windowStart = store?.password_reset_window_start
      ? new Date(store.password_reset_window_start).getTime()
      : 0;

    // Check if we're in a new window (reset attempts if window expired)
    if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
      attempts = 0;
      windowStart = now;
    }

    // Check if rate limited
    if (attempts >= MAX_RESET_ATTEMPTS) {
      const timeLeftMs = RATE_LIMIT_WINDOW_MS - (now - windowStart);
      const minutesLeft = Math.ceil(timeLeftMs / 60000);

      return NextResponse.json(
        {
          error: `Too many reset attempts. Please try again in ${minutesLeft} minutes, or contact support at ${SUPPORT_EMAIL}`,
          rateLimited: true,
          retryAfterMinutes: minutesLeft
        },
        { status: 429 }
      );
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token and update rate limiting in database
    const { error: updateError } = await supabase
      .from("stores")
      .update({
        admin_password_reset_token: resetToken,
        admin_password_reset_expires: expiresAt.toISOString(),
        password_reset_attempts: attempts + 1,
        password_reset_window_start: new Date(windowStart || now).toISOString(),
      })
      .eq("id", storeId);

    if (updateError) {
      console.error("Failed to store reset token:", updateError);
      return NextResponse.json(
        { error: "Failed to initiate password reset. Please try again or contact support at " + SUPPORT_EMAIL },
        { status: 500 }
      );
    }

    // Send reset email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const resetUrl = `${appUrl}/admin/reset-password?token=${resetToken}`;

    const emailSent = await sendPasswordResetEmail(ownerEmail, resetUrl);

    if (!emailSent) {
      console.error("Failed to send reset email - email service may not be configured");
      return NextResponse.json(
        {
          success: false,
          error: `Unable to send password reset email. Please contact support at ${SUPPORT_EMAIL}`
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
      attemptsRemaining: MAX_RESET_ATTEMPTS - (attempts + 1)
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: `Failed to process password reset. Please contact support at ${SUPPORT_EMAIL}` },
      { status: 500 }
    );
  }
}
