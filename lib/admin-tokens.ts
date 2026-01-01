import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

// Verify admin token against database
export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token) {
    return false;
  }

  const supabase = getSupabaseAdmin();
  const storeId = getStoreId();

  if (!supabase || !storeId) {
    return false;
  }

  // Check if token exists and is not expired
  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("id, expires_at")
    .eq("store_id", storeId)
    .eq("token", token)
    .single();

  if (error || !session) {
    return false;
  }

  // Check if token has expired
  if (new Date(session.expires_at) < new Date()) {
    // Clean up expired token
    await supabase
      .from("admin_sessions")
      .delete()
      .eq("id", session.id);
    return false;
  }

  return true;
}

// Helper to extract token from request and verify
export async function verifyAuthFromRequest(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return verifyAdminToken(token);
}

// Get admin password for platform API authentication
export function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

