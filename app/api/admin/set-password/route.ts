import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const storeId = getStoreId();
    if (!storeId) {
      return NextResponse.json(
        { error: "Store not configured" },
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

    // Verify token and check expiry
    const { data: store, error: fetchError } = await supabase
      .from("stores")
      .select("admin_password_reset_token, admin_password_reset_expires")
      .eq("id", storeId)
      .single();

    if (fetchError || !store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    if (store.admin_password_reset_token !== token) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (new Date(store.admin_password_reset_expires) < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Hash the new password and store it
    const passwordHash = createHash("sha256").update(password).digest("hex");

    const { error: updateError } = await supabase
      .from("stores")
      .update({
        admin_password_hash: passwordHash,
        admin_password_reset_token: null,
        admin_password_reset_expires: null,
      })
      .eq("id", storeId);

    if (updateError) {
      console.error("Failed to update password:", updateError);
      return NextResponse.json(
        { error: "Failed to set new password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    );
  }
}
