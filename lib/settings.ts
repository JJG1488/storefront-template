import { getSupabaseAdmin, getStoreId, isBuildTime } from "@/lib/supabase";
import { getStoreConfig } from "@/lib/store";

/**
 * Runtime store settings that can be changed without redeploy.
 * These are fetched from the database and fall back to env vars.
 */
export interface RuntimeSettings {
  // Branding
  themePreset: string;
  logoUrl: string;

  // Content
  announcementBar: string;
  tagline: string;
  aboutText: string;

  // Policies
  shippingPromise: string;
  returnPolicy: string;

  // Social links
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  tiktokUrl: string;
}

/**
 * Returns default settings from environment variables.
 * Used as fallback when database is unavailable.
 */
function getDefaultSettings(): RuntimeSettings {
  const config = getStoreConfig();
  return {
    themePreset: config.themePreset || "default",
    logoUrl: config.logoUrl || "",
    announcementBar: config.announcementBar || "",
    tagline: config.tagline || "",
    aboutText: config.aboutText || "",
    shippingPromise: config.shippingPromise || "Free shipping on orders over $50",
    returnPolicy: config.returnPolicy || "30-day easy returns",
    instagramUrl: config.instagramUrl || "",
    facebookUrl: config.facebookUrl || "",
    twitterUrl: config.twitterUrl || "",
    tiktokUrl: config.tiktokUrl || "",
  };
}

/**
 * Fetches all runtime settings from the database.
 * Falls back to environment variables if database is unavailable.
 *
 * Use this for settings that store owners should be able to change
 * without redeploying their store.
 */
export async function getStoreSettingsFromDB(): Promise<RuntimeSettings> {
  const defaults = getDefaultSettings();

  // During build, use env vars
  if (isBuildTime()) {
    return defaults;
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return defaults;
    }

    const { data } = await supabase
      .from("store_settings")
      .select("settings")
      .eq("store_id", storeId)
      .single();

    if (data?.settings) {
      // Merge database settings with defaults (DB takes precedence)
      return {
        themePreset: data.settings.themePreset || defaults.themePreset,
        logoUrl: data.settings.logoUrl || defaults.logoUrl,
        announcementBar: data.settings.announcementBar ?? defaults.announcementBar,
        tagline: data.settings.tagline ?? defaults.tagline,
        aboutText: data.settings.aboutText ?? defaults.aboutText,
        shippingPromise: data.settings.shippingPromise || defaults.shippingPromise,
        returnPolicy: data.settings.returnPolicy || defaults.returnPolicy,
        instagramUrl: data.settings.instagramUrl ?? defaults.instagramUrl,
        facebookUrl: data.settings.facebookUrl ?? defaults.facebookUrl,
        twitterUrl: data.settings.twitterUrl ?? defaults.twitterUrl,
        tiktokUrl: data.settings.tiktokUrl ?? defaults.tiktokUrl,
      };
    }
  } catch (error) {
    console.error("Failed to fetch settings from DB:", error);
  }

  return defaults;
}

/**
 * Fetches the theme preset from the database at runtime.
 * Falls back to environment variable if database is unavailable.
 * @deprecated Use getStoreSettingsFromDB() instead for all settings
 */
export async function getThemePresetFromDB(): Promise<string> {
  const settings = await getStoreSettingsFromDB();
  return settings.themePreset;
}
