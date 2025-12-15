import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { activeTokens } from "@/lib/admin-tokens";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

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

function createAuthToken(): string {
  const token = generateToken();
  activeTokens.add(token);

  // Clean up old tokens (keep max 10)
  if (activeTokens.size > 10) {
    const oldest = activeTokens.values().next().value;
    if (oldest) activeTokens.delete(oldest);
  }

  return token;
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    // Check Super Admin password first (platform-wide access)
    if (superAdminPassword && secureCompare(password, superAdminPassword)) {
      const token = createAuthToken();
      return NextResponse.json({ token, isSuperAdmin: true });
    }

    // Check database password (set via password reset)
    const storeId = getStoreId();
    if (storeId) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: store } = await supabase
          .from("stores")
          .select("admin_password_hash")
          .eq("id", storeId)
          .single();

        if (store?.admin_password_hash) {
          if (secureCompareHash(password, store.admin_password_hash)) {
            const token = createAuthToken();
            return NextResponse.json({ token });
          }
          // If DB password exists but doesn't match, don't fall back to env var
          // This ensures reset password overrides the original
          return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }
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
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = createAuthToken();
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
