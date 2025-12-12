// Store configuration from environment variables
export function getStoreConfig() {
  return {
    id: process.env.NEXT_PUBLIC_STORE_ID || "",
    name: process.env.STORE_NAME || "My Store",
    primaryColor: process.env.BRAND_COLOR || "#6366f1",
    themePreset: process.env.THEME_PRESET || "default",
    logoUrl: process.env.LOGO_URL || "",
    stripeAccountId: process.env.STRIPE_ACCOUNT_ID || "",
    shippingEnabled: process.env.SHIPPING_ENABLED === "true",
    taxEnabled: process.env.TAX_ENABLED === "true",
  };
}
