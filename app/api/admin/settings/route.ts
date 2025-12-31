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
    // Use fresh client with cache-busting fetch to avoid stale data
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

    // Use .limit(1) instead of .single() to avoid Supabase PostgREST caching
    const { data: rows, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("store_id", storeId)
      .limit(1);
    const data = rows?.[0] || null;

    if (error || !data) {
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
    // Use fresh client with cache-busting fetch
    const supabase = createFreshAdminClient();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();

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
