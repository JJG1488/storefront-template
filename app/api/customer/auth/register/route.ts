import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";
import { sendCustomerWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Hash password with SHA-256 (matches admin auth pattern)
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// Generate random token for email verification
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// Generate session token
function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Token expiration: 30 days for customer sessions
const SESSION_EXPIRY_DAYS = 30;

interface RegisterBody {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterBody = await request.json();
    const { email, password, firstName, lastName, acceptsMarketing } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
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

    // Check if customer already exists
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("store_id", storeId)
      .ilike("email", email.toLowerCase().trim())
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create customer
    const passwordHash = hashPassword(password);
    const verificationToken = generateToken();

    const { data: customer, error: createError } = await supabase
      .from("customers")
      .insert({
        store_id: storeId,
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
        accepts_marketing: acceptsMarketing || false,
        email_verified: false,
      })
      .select("id, email, first_name, last_name")
      .single();

    if (createError) {
      console.error("Failed to create customer:", createError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Create session token
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(
      Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: sessionError } = await supabase
      .from("customer_sessions")
      .insert({
        customer_id: customer.id,
        token: sessionToken,
        expires_at: expiresAt,
        user_agent: request.headers.get("user-agent") || null,
      });

    if (sessionError) {
      console.error("Failed to create session:", sessionError);
      // Customer was created, but session failed - still return success
    }

    // Send welcome email (non-blocking)
    const customerDisplayName = customer.first_name || email.split("@")[0];
    sendCustomerWelcomeEmail(customer.email, customerDisplayName).catch((err) => {
      console.error("Failed to send welcome email:", err);
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
