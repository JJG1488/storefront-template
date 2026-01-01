import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Hash password with SHA-256
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// Generate session token
function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Token expiration: 30 days for customer sessions
const SESSION_EXPIRY_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
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

    // Find customer with this reset token
    const { data: customers } = await supabase
      .from("customers")
      .select("id, email, first_name, last_name, password_reset_expires")
      .eq("store_id", storeId)
      .eq("password_reset_token", token)
      .limit(1);

    if (!customers || customers.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const customer = customers[0];

    // Check if token has expired
    if (
      customer.password_reset_expires &&
      new Date(customer.password_reset_expires) < new Date()
    ) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update password and clear reset token
    const passwordHash = hashPassword(password);
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq("id", customer.id);

    if (updateError) {
      console.error("Failed to update password:", updateError);
      return NextResponse.json(
        { error: "Failed to reset password" },
        { status: 500 }
      );
    }

    // Invalidate all existing sessions for security
    await supabase
      .from("customer_sessions")
      .delete()
      .eq("customer_id", customer.id);

    // Create new session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(
      Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    await supabase.from("customer_sessions").insert({
      customer_id: customer.id,
      token: sessionToken,
      expires_at: expiresAt,
      user_agent: request.headers.get("user-agent") || null,
    });

    return NextResponse.json({
      success: true,
      token: sessionToken,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
