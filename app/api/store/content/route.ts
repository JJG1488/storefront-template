import { NextResponse } from "next/server";
import { createFreshAdminClient, getStoreId, isBuildTime } from "@/lib/supabase";
import { defaultContent } from "@/lib/content";

// Prevent caching - content must always be fresh
export const dynamic = "force-dynamic";

// Helper to add no-cache headers
function jsonResponseNoCache(data: object, status = 200) {
  const response = NextResponse.json(data, { status });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

// GET - Fetch public store content (shipping, returns, faq)
// No authentication required - this is public content
export async function GET() {
  if (isBuildTime()) {
    return jsonResponseNoCache(defaultContent);
  }

  try {
    const supabase = createFreshAdminClient();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return jsonResponseNoCache(defaultContent);
    }

    // Use .limit(1) instead of .single() to avoid Supabase PostgREST caching
    const { data: rows, error } = await supabase
      .from("store_settings")
      .select("settings")
      .eq("store_id", storeId)
      .limit(1);
    const data = rows?.[0] || null;

    if (error || !data?.settings?.content) {
      return jsonResponseNoCache(defaultContent);
    }

    // Merge with defaults to ensure all fields exist
    const content = data.settings.content;
    return jsonResponseNoCache({
      shipping: { ...defaultContent.shipping, ...content.shipping },
      returns: { ...defaultContent.returns, ...content.returns },
      faq: content.faq?.length > 0 ? content.faq : defaultContent.faq,
    });
  } catch (error) {
    console.error("Failed to fetch store content:", error);
    return jsonResponseNoCache(defaultContent);
  }
}
