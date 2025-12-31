import { NextRequest, NextResponse } from "next/server";
import { createFreshAdminClient, getStoreId, isBuildTime } from "@/lib/supabase";
import { getStoreConfig } from "@/lib/store";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";

// Prevent caching - settings must always be fresh
export const dynamic = "force-dynamic";

// Helper to add no-cache headers
function jsonResponseNoCache(data: object, status = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

// GET - Fetch current settings
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`[Settings GET ${timestamp}] ========== START ==========`);

  if (isBuildTime()) {
    console.log(`[Settings GET ${timestamp}] Build time - returning empty`);
    return jsonResponseNoCache({ settings: {} });
  }

  if (!(await verifyAuthFromRequest(request))) {
    console.log(`[Settings GET ${timestamp}] Unauthorized`);
    return jsonResponseNoCache({ error: "Unauthorized" }, 401);
  }

  try {
    // First, try to get settings from the database
    // Use fresh client to avoid stale cached data
    const supabase = createFreshAdminClient();
    const storeId = getStoreId();
    console.log(`[Settings GET ${timestamp}] storeId: ${storeId}`);

    if (!supabase || !storeId) {
      console.log(`[Settings GET ${timestamp}] No supabase or storeId - using env fallback`);
      // Fall back to environment variables
      const config = getStoreConfig();
      return jsonResponseNoCache({
        settings: {
          name: config.name,
          tagline: config.tagline,
          aboutText: config.aboutText,
          announcementBar: config.announcementBar,
          shippingPromise: config.shippingPromise,
          returnPolicy: config.returnPolicy,
          instagramUrl: config.instagramUrl,
          facebookUrl: config.facebookUrl,
          twitterUrl: config.twitterUrl,
          tiktokUrl: config.tiktokUrl,
        },
      });
    }

    // Try to get settings from store_settings table
    // IMPORTANT: Use .limit(1) instead of .single() to avoid Supabase PostgREST caching issues
    const { data: rows, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("store_id", storeId)
      .limit(1);
    const data = rows?.[0] || null;

    console.log(`[Settings GET ${timestamp}] Query error:`, error);
    console.log(`[Settings GET ${timestamp}] Rows count:`, rows?.length);
    console.log(`[Settings GET ${timestamp}] Row updated_at:`, data?.updated_at);
    console.log(`[Settings GET ${timestamp}] Raw settings:`, JSON.stringify(data?.settings));

    if (error || !data) {
      console.log(`[Settings GET ${timestamp}] No data found - using env fallback`);
      // Fall back to environment variables if no settings in DB
      const config = getStoreConfig();
      return jsonResponseNoCache({
        settings: {
          name: config.name,
          tagline: config.tagline,
          aboutText: config.aboutText,
          announcementBar: config.announcementBar,
          shippingPromise: config.shippingPromise,
          returnPolicy: config.returnPolicy,
          instagramUrl: config.instagramUrl,
          facebookUrl: config.facebookUrl,
          twitterUrl: config.twitterUrl,
          tiktokUrl: config.tiktokUrl,
        },
      });
    }

    // Merge DB settings with env var defaults
    // Use ?? for optional text fields to preserve actual saved values (including empty strings)
    // Use || for required fields that should always have a value
    const config = getStoreConfig();
    const mergedSettings = {
      name: data.settings?.name || config.name,
      tagline: data.settings?.tagline ?? config.tagline,
      aboutText: data.settings?.aboutText ?? config.aboutText,
      announcementBar: data.settings?.announcementBar ?? config.announcementBar,
      shippingPromise: data.settings?.shippingPromise || config.shippingPromise,
      returnPolicy: data.settings?.returnPolicy || config.returnPolicy,
      instagramUrl: data.settings?.instagramUrl ?? config.instagramUrl,
      facebookUrl: data.settings?.facebookUrl ?? config.facebookUrl,
      twitterUrl: data.settings?.twitterUrl ?? config.twitterUrl,
      tiktokUrl: data.settings?.tiktokUrl ?? config.tiktokUrl,
      themePreset: data.settings?.themePreset || config.themePreset || "default",
      videoBanner: data.settings?.videoBanner || null,
      content: data.settings?.content || null,
    };
    console.log(`[Settings GET ${timestamp}] Returning merged tagline:`, mergedSettings.tagline);
    console.log(`[Settings GET ${timestamp}] ========== END ==========`);
    return jsonResponseNoCache({ settings: mergedSettings });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return jsonResponseNoCache({ error: "Failed to fetch settings" }, 500);
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`[Settings PUT ${timestamp}] ========== START ==========`);

  if (isBuildTime()) {
    return NextResponse.json({ error: "Not available during build" }, { status: 400 });
  }

  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use fresh client to avoid stale cached data
    const supabase = createFreshAdminClient();
    const storeId = getStoreId();
    console.log(`[Settings PUT ${timestamp}] storeId: ${storeId}`);

    if (!supabase || !storeId) {
      console.log(`[Settings PUT ${timestamp}] No supabase or storeId`);
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log(`[Settings PUT ${timestamp}] Saving tagline:`, body.tagline);
    console.log(`[Settings PUT ${timestamp}] Full body:`, JSON.stringify(body).slice(0, 500));

    // Upsert settings
    const { data, error } = await supabase
      .from("store_settings")
      .upsert(
        {
          store_id: storeId,
          settings: body,
          updated_at: timestamp,
        },
        {
          onConflict: "store_id",
        }
      )
      .select()
      .single();

    console.log(`[Settings PUT ${timestamp}] Upsert error:`, error);
    console.log(`[Settings PUT ${timestamp}] Upsert result:`, data ? "success" : "no data");
    console.log(`[Settings PUT ${timestamp}] Saved updated_at:`, data?.updated_at);
    console.log(`[Settings PUT ${timestamp}] ========== END ==========`);

    if (error) {
      console.error("Failed to save settings:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, settings: data.settings });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
