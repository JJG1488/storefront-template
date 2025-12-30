import { getSupabaseAdmin, getStoreId, isBuildTime } from "@/lib/supabase";
import type { VideoBannerProps } from "@/components/VideoBanner";

interface VideoBannerSettings {
  enabled?: boolean;
  type?: "youtube" | "upload" | "image";
  youtubeUrl?: string;
  uploadedUrl?: string;
  imageUrl?: string;
}

/**
 * Fetches video banner settings from store_settings table
 * Used server-side on the homepage to conditionally render the video banner
 */
export async function getVideoBannerSettings(): Promise<VideoBannerProps> {
  // Default disabled state
  const defaultSettings: VideoBannerProps = {
    enabled: false,
    type: "youtube",
    youtubeUrl: "",
    uploadedUrl: "",
    imageUrl: "",
  };

  // Don't fetch during build time
  if (isBuildTime()) {
    return defaultSettings;
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return defaultSettings;
    }

    // Fetch settings from store_settings table
    const { data, error } = await supabase
      .from("store_settings")
      .select("settings")
      .eq("store_id", storeId)
      .single();

    if (error || !data?.settings) {
      return defaultSettings;
    }

    // Extract video banner settings from the full settings object
    const settings = data.settings as { videoBanner?: VideoBannerSettings };
    const videoBanner = settings.videoBanner;

    if (!videoBanner) {
      return defaultSettings;
    }

    return {
      enabled: videoBanner.enabled ?? false,
      type: videoBanner.type ?? "youtube",
      youtubeUrl: videoBanner.youtubeUrl ?? "",
      uploadedUrl: videoBanner.uploadedUrl ?? "",
      imageUrl: videoBanner.imageUrl ?? "",
    };
  } catch (error) {
    console.error("Failed to fetch video banner settings:", error);
    return defaultSettings;
  }
}
