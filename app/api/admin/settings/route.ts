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
  if (isBuildTime()) {
    return jsonResponseNoCache({ settings: {} });
  }

  if (!(await verifyAuthFromRequest(request))) {
    return jsonResponseNoCache({ error: "Unauthorized" }, 401);
  }

  try {
    // First, try to get settings from the database
    // Use fresh client to avoid stale cached data
    const supabase = createFreshAdminClient();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
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

    // Debug: Add timestamp to prove this is a fresh query
    console.log("========== SETTINGS GET START ==========");
    console.log("[Settings GET] Query time:", new Date().toISOString());

    // Debug: Check ALL rows in the table first
    const { data: allRows, error: allError } = await supabase
      .from("store_settings")
      .select("store_id, updated_at");
    console.log("[Settings GET] allRows error:", allError?.message || "none");
    console.log("[Settings GET] ALL rows in table:", JSON.stringify(allRows));
    console.log("[Settings GET] Looking for storeId:", storeId);

    // Try to get settings from store_settings table
    // Use .limit(1) instead of .single() to avoid potential caching issues
    const { data: rows, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("store_id", storeId)
      .limit(1);
    const data = rows?.[0] || null;

    // Debug logging - check Vercel function logs
    console.log("[Settings GET] storeId:", storeId);
    console.log("[Settings GET] query error:", error?.message || "none");
    console.log("[Settings GET] data found:", !!data);
    // Log the RAW data from Supabase to see exact structure
    console.log("[Settings GET] RAW data:", JSON.stringify(data));
    if (data?.settings) {
      console.log("[Settings GET] data.settings keys:", Object.keys(data.settings));
      // Show actual values for key fields
      console.log("[Settings GET] tagline value:", JSON.stringify(data.settings.tagline));
      console.log("[Settings GET] aboutText value:", JSON.stringify(data.settings.aboutText));
      console.log("[Settings GET] announcementBar value:", JSON.stringify(data.settings.announcementBar));
      console.log("[Settings GET] name value:", JSON.stringify(data.settings.name));
    }

    if (error || !data) {
      console.log("[Settings GET] Falling back to config defaults - error:", error?.message);
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
    return jsonResponseNoCache({
      settings: {
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
      },
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return jsonResponseNoCache({ error: "Failed to fetch settings" }, 500);
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
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

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Debug logging
    console.log("[Settings PUT] storeId:", storeId);
    console.log("[Settings PUT] body keys:", Object.keys(body));
    console.log("[Settings PUT] tagline being saved:", JSON.stringify(body.tagline));
    console.log("[Settings PUT] aboutText being saved:", JSON.stringify(body.aboutText));
    console.log("[Settings PUT] announcementBar being saved:", JSON.stringify(body.announcementBar));
    console.log("[Settings PUT] name being saved:", JSON.stringify(body.name));

    // Upsert settings
    const { data, error } = await supabase
      .from("store_settings")
      .upsert(
        {
          store_id: storeId,
          settings: body,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "store_id",
        }
      )
      .select()
      .single();

    // Debug logging
    console.log("[Settings PUT] upsert error:", error?.message || "none");
    console.log("[Settings PUT] upsert success:", !!data);
    if (data?.settings) {
      console.log("[Settings PUT] saved settings keys:", Object.keys(data.settings));
      // Show what was actually saved to DB
      console.log("[Settings PUT] DB now has tagline:", JSON.stringify(data.settings.tagline));
      console.log("[Settings PUT] DB now has aboutText:", JSON.stringify(data.settings.aboutText));
      console.log("[Settings PUT] DB now has announcementBar:", JSON.stringify(data.settings.announcementBar));
    }

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
