import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { activeTokens } from "@/lib/admin-tokens";

// Simple token generation - in production use proper JWT
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 500 }
      );
    }

    // Compare passwords
    const inputHash = createHash("sha256").update(password).digest("hex");
    const storedHash = createHash("sha256").update(adminPassword).digest("hex");

    if (inputHash !== storedHash) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = generateToken();
    activeTokens.add(token);

    // Clean up old tokens (keep max 10)
    if (activeTokens.size > 10) {
      const oldest = activeTokens.values().next().value;
      if (oldest) activeTokens.delete(oldest);
    }

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
