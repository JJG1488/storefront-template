import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";
import { sendPasswordResetEmail } from "@/lib/email";

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
        { error: "Store owner email not configured" },
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

    // Generate reset token (valid for 1 hour)
    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    const { error: updateError } = await supabase
      .from("stores")
      .update({
        admin_password_reset_token: resetToken,
        admin_password_reset_expires: expiresAt.toISOString(),
      })
      .eq("id", storeId);

    if (updateError) {
      console.error("Failed to store reset token:", updateError);
      return NextResponse.json(
        { error: "Failed to initiate password reset" },
        { status: 500 }
      );
    }

    // Send reset email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const resetUrl = `${appUrl}/admin/reset-password?token=${resetToken}`;

    const emailSent = await sendPasswordResetEmail(ownerEmail, resetUrl);

    if (!emailSent) {
      console.error("Failed to send reset email - RESEND_API_KEY may not be configured");
      return NextResponse.json(
        {
          success: false,
          error: "Unable to send password reset email. Please contact support."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset" },
      { status: 500 }
    );
  }
}
