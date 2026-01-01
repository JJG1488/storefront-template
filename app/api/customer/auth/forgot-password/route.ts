import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";
import { sendCustomerPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Token expires in 1 hour
const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    // Find customer by email
    const { data: customers } = await supabase
      .from("customers")
      .select("id, email, first_name")
      .eq("store_id", storeId)
      .ilike("email", email.toLowerCase().trim())
      .limit(1);

    // Always return success to prevent email enumeration
    // But only send email if customer exists
    if (customers && customers.length > 0) {
      const customer = customers[0];

      // Generate reset token
      const resetToken = randomBytes(32).toString("hex");
      const expiresAt = new Date(
        Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
      ).toISOString();

      // Save token to database
      await supabase
        .from("customers")
        .update({
          password_reset_token: resetToken,
          password_reset_expires: expiresAt,
        })
        .eq("id", customer.id);

      // Build reset URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const resetUrl = `${appUrl}/account/reset-password?token=${resetToken}`;

      // Send email
      await sendCustomerPasswordResetEmail(
        customer.email,
        customer.first_name || "Customer",
        resetUrl
      );
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
