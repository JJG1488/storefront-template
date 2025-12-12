import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

// Check if we're in a build environment without runtime env vars
export function isBuildTime(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !supabaseUrl || supabaseUrl === "";
}

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

export function getStoreId(): string {
  return process.env.NEXT_PUBLIC_STORE_ID || "";
}
