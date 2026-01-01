import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Constant-time comparison to prevent timing attacks
function secureCompareHash(password: string, storedHash: string): boolean {
  const inputHash = createHash("sha256").update(password).digest("hex");

  if (inputHash.length !== storedHash.length) return false;

  let result = 0;
  for (let i = 0; i < inputHash.length; i++) {
    result |= inputHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

// Generate session token
function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Token expiration: 30 days for customer sessions
const SESSION_EXPIRY_DAYS = 30;

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginBody = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
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
    const { data: customers, error: findError } = await supabase
      .from("customers")
      .select("id, email, password_hash, first_name, last_name")
      .eq("store_id", storeId)
      .ilike("email", email.toLowerCase().trim())
      .limit(1);

    if (findError || !customers || customers.length === 0) {
      // Use generic error to prevent email enumeration
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const customer = customers[0];

    // Verify password
    if (!secureCompareHash(password, customer.password_hash)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Clean up expired sessions for this customer
    await supabase
      .from("customer_sessions")
      .delete()
      .eq("customer_id", customer.id)
      .lt("expires_at", new Date().toISOString());

    // Limit active sessions per customer (keep max 10)
    const { data: sessions } = await supabase
      .from("customer_sessions")
      .select("id, created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: true });

    if (sessions && sessions.length >= 10) {
      const toDelete = sessions.slice(0, sessions.length - 9);
      await supabase
        .from("customer_sessions")
        .delete()
        .in(
          "id",
          toDelete.map((s) => s.id)
        );
    }

    // Create new session
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
      return NextResponse.json(
        { error: "Login failed" },
        { status: 500 }
      );
    }

    // Update last login
    await supabase
      .from("customers")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", customer.id);

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
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
