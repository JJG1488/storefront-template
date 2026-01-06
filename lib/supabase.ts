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
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Require service role key for admin operations - do NOT fall back to anon key
    // as this causes silent RLS failures that are hard to debug
    if (!serviceRoleKey) {
      console.error(
        "[Supabase] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not configured. " +
        "Admin operations (orders, products, settings) will fail. " +
        "Please set this environment variable in your deployment."
      );
      return null;
    }

    supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey);
  }
  return supabaseAdminInstance;
}

export function getStoreId(): string {
  return process.env.NEXT_PUBLIC_STORE_ID || "";
}

// Create a fresh admin client (no caching) - use when stale data is a problem
export function createFreshAdminClient(): SupabaseClient | null {
  if (isBuildTime()) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Require service role key - do NOT fall back to anon key
  if (!serviceRoleKey) {
    console.error(
      "[Supabase] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not configured for fresh admin client."
    );
    return null;
  }

  // Force no caching at fetch level to bypass Supabase PostgREST caching
  return createClient(supabaseUrl, serviceRoleKey, {
    global: {
      fetch: (url, options = {}) => {
        // Properly merge headers - options.headers can be Headers object or plain object
        const existingHeaders = options.headers instanceof Headers
          ? Object.fromEntries(options.headers.entries())
          : (options.headers || {});

        return fetch(url, {
          ...options,
          cache: 'no-store',
          headers: {
            ...existingHeaders,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
      },
    },
  });
}

// Create a fresh anon client (no caching) - use for public pages that need fresh data
// This uses the anon key so it's still subject to RLS policies
export function createFreshAnonClient(): SupabaseClient | null {
  if (isBuildTime()) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseAnonKey) {
    console.error("[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY not configured.");
    return null;
  }

  // Force no caching at fetch level to bypass Supabase PostgREST caching
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (url, options = {}) => {
        const existingHeaders = options.headers instanceof Headers
          ? Object.fromEntries(options.headers.entries())
          : (options.headers || {});

        return fetch(url, {
          ...options,
          cache: 'no-store',
          headers: {
            ...existingHeaders,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
      },
    },
  });
}
