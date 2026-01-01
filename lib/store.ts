// Store configuration from environment variables
// All client-accessible vars must use NEXT_PUBLIC_ prefix
export function getStoreConfig() {
  return {
    id: process.env.NEXT_PUBLIC_STORE_ID || "",
    name: process.env.NEXT_PUBLIC_STORE_NAME || "My Store",
    tagline: process.env.NEXT_PUBLIC_STORE_TAGLINE || "",
    aboutText: process.env.NEXT_PUBLIC_ABOUT_TEXT || "",
    primaryColor: process.env.NEXT_PUBLIC_BRAND_COLOR || "#6366f1",
    themePreset: process.env.NEXT_PUBLIC_THEME_PRESET || "default",
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || "",
    stripeAccountId: process.env.STRIPE_ACCOUNT_ID || "",
    shippingEnabled: process.env.SHIPPING_ENABLED === "true",
    shippingCountries: (process.env.SHIPPING_COUNTRIES || "US").split(",").filter(Boolean),
    taxEnabled: process.env.TAX_ENABLED === "true",
    // Currency (defaults to USD)
    currency: process.env.NEXT_PUBLIC_STORE_CURRENCY || "USD",
    // Social links
    instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
    facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
    twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL || "",
    tiktokUrl: process.env.NEXT_PUBLIC_TIKTOK_URL || "",
    // Announcements
    announcementBar: process.env.NEXT_PUBLIC_ANNOUNCEMENT_BAR || "",
    // Policies
    shippingPromise: process.env.NEXT_PUBLIC_SHIPPING_PROMISE || "Free shipping on orders over $50",
    returnPolicy: process.env.NEXT_PUBLIC_RETURN_POLICY || "30-day easy returns",
  };
}
