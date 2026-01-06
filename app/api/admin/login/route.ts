import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

// Token expiration: 24 hours
const TOKEN_EXPIRY_HOURS = 24;

// Rate limiting: max 5 attempts per IP per 15 minutes
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

// In-memory rate limiting store (resets on server restart)
// For production, consider using Redis or database-backed rate limiting
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    return false;
  }

  return record.count >= MAX_LOGIN_ATTEMPTS;
}

function recordLoginAttempt(ip: string, success: boolean): void {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    // Start new window
    loginAttempts.set(ip, {
      count: success ? 0 : 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
  } else if (!success) {
    // Increment failed attempts
    record.count++;
  } else {
    // Success - clear attempts
    loginAttempts.delete(ip);
  }

  // Cleanup old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    for (const [key, value] of loginAttempts.entries()) {
      if (now > value.resetAt) {
        loginAttempts.delete(key);
      }
    }
  }
}

// Simple token generation - in production use proper JWT
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// Constant-time comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  const aHash = createHash("sha256").update(a).digest("hex");
  const bHash = createHash("sha256").update(b).digest("hex");

  if (aHash.length !== bHash.length) return false;

  let result = 0;
  for (let i = 0; i < aHash.length; i++) {
    result |= aHash.charCodeAt(i) ^ bHash.charCodeAt(i);
  }
  return result === 0;
}

// Compare password against stored hash
function secureCompareHash(password: string, storedHash: string): boolean {
  const inputHash = createHash("sha256").update(password).digest("hex");

  if (inputHash.length !== storedHash.length) return false;

  let result = 0;
  for (let i = 0; i < inputHash.length; i++) {
    result |= inputHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

async function createAuthToken(storeId: string, supabase: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  if (!supabase) {
    console.error("Supabase not available for token creation");
    return null;
  }

  // Clean up expired tokens for this store
  await supabase
    .from("admin_sessions")
    .delete()
    .eq("store_id", storeId)
    .lt("expires_at", new Date().toISOString());

  // Limit active sessions per store (keep max 10)
  const { data: sessions } = await supabase
    .from("admin_sessions")
    .select("id, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });

  if (sessions && sessions.length >= 10) {
    // Delete oldest sessions
    const toDelete = sessions.slice(0, sessions.length - 9);
    await supabase
      .from("admin_sessions")
      .delete()
      .in("id", toDelete.map(s => s.id));
  }

  // Insert new token
  const { error } = await supabase
    .from("admin_sessions")
    .insert({
      store_id: storeId,
      token,
      expires_at: expiresAt,
    });

  if (error) {
    console.error("Failed to create auth token:", error);
    return null;
  }

  return token;
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // Check rate limit before processing
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
    const storeId = getStoreId();
    const supabase = getSupabaseAdmin();

    if (!storeId) {
      return NextResponse.json(
        { error: "Store not configured" },
        { status: 500 }
      );
    }

    // Check Super Admin password first (platform-wide access)
    if (superAdminPassword && secureCompare(password, superAdminPassword)) {
      const token = await createAuthToken(storeId, supabase);
      if (!token) {
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
      }
      recordLoginAttempt(clientIp, true);
      return NextResponse.json({ token, isSuperAdmin: true });
    }

    // Check database password (set via password reset)
    if (supabase) {
      const { data: store } = await supabase
        .from("stores")
        .select("admin_password_hash")
        .eq("id", storeId)
        .single();

      if (store?.admin_password_hash) {
        if (secureCompareHash(password, store.admin_password_hash)) {
          const token = await createAuthToken(storeId, supabase);
          if (!token) {
            return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
          }
          recordLoginAttempt(clientIp, true);
          return NextResponse.json({ token });
        }
        // If DB password exists but doesn't match, don't fall back to env var
        // This ensures reset password overrides the original
        recordLoginAttempt(clientIp, false);
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }
    }

    // Fall back to env var password (original password set during deployment)
    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 500 }
      );
    }

    if (!secureCompare(password, adminPassword)) {
      recordLoginAttempt(clientIp, false);
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = await createAuthToken(storeId, supabase);
    if (!token) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
    recordLoginAttempt(clientIp, true);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
