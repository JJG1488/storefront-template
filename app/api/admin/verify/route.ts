import { NextRequest, NextResponse } from "next/server";
import { activeTokens } from "@/lib/admin-tokens";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || !activeTokens.has(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}
