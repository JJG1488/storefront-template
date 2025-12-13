// Store configuration from environment variables
// All client-accessible vars must use NEXT_PUBLIC_ prefix
export function getStoreConfig() {
  return {
    id: process.env.NEXT_PUBLIC_STORE_ID || "",
    name: process.env.NEXT_PUBLIC_STORE_NAME || "My Store",
    primaryColor: process.env.NEXT_PUBLIC_BRAND_COLOR || "#6366f1",
    themePreset: process.env.NEXT_PUBLIC_THEME_PRESET || "default",
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || "",
    stripeAccountId: process.env.STRIPE_ACCOUNT_ID || "",
    shippingEnabled: process.env.SHIPPING_ENABLED === "true",
    taxEnabled: process.env.TAX_ENABLED === "true",
  };
}
