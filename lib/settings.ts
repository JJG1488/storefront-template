import { getSupabaseAdmin, getStoreId, isBuildTime } from "@/lib/supabase";

/**
 * Fetches the theme preset from the database at runtime.
 * Falls back to environment variable if database is unavailable.
 */
export async function getThemePresetFromDB(): Promise<string> {
  // During build, use env var
  if (isBuildTime()) {
    return process.env.NEXT_PUBLIC_THEME_PRESET || "default";
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return process.env.NEXT_PUBLIC_THEME_PRESET || "default";
    }

    const { data } = await supabase
      .from("store_settings")
      .select("settings")
      .eq("store_id", storeId)
      .single();

    if (data?.settings?.themePreset) {
      return data.settings.themePreset;
    }
  } catch (error) {
    console.error("Failed to fetch theme from DB:", error);
  }

  // Fallback to env var
  return process.env.NEXT_PUBLIC_THEME_PRESET || "default";
}
