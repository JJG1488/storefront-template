import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

// Check if we're in a build environment without runtime env vars
export function isBuildTime(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !supabaseUrl || supabaseUrl === "";
}

// Client for public operations (uses anon key, subject to RLS)
export function getSupabase(): SupabaseClient | null {
  // During build time, return null to avoid errors
  if (isBuildTime()) {
    return null as unknown as SupabaseClient;
  }

  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// Admin client for privileged operations (uses service role key, bypasses RLS)
export function getSupabaseAdmin(): SupabaseClient | null {
  // During build time, return null to avoid errors
  if (isBuildTime()) {
    return null as unknown as SupabaseClient;
  }

  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Use service role key for admin operations, fall back to anon key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey);
  }
  return supabaseAdminInstance;
}

export function getStoreId(): string {
  return process.env.NEXT_PUBLIC_STORE_ID || "";
}
