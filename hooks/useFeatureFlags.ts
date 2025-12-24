/**
 * Feature flags hook for tier-based feature gating.
 *
 * Environment variables are set during deployment based on the store's payment tier:
 * - PAYMENT_TIER: "starter" | "pro" | "hosted"
 * - MAX_PRODUCTS: "10" | "unlimited"
 * - CUSTOM_DOMAIN_ENABLED: "true" | "false"
 * - ANALYTICS_ENABLED: "true" | "false"
 * - PREMIUM_THEMES_ENABLED: "true" | "false"
 */

export type PaymentTier = "starter" | "pro" | "hosted";

export interface FeatureFlags {
  tier: PaymentTier;
  maxProducts: number;
  isUnlimitedProducts: boolean;
  customDomainEnabled: boolean;
  analyticsEnabled: boolean;
  premiumThemesEnabled: boolean;
  isPro: boolean;
  isHosted: boolean;
}

/**
 * Returns feature flags based on the store's payment tier.
 * Safe to call on both server and client components.
 */
export function useFeatureFlags(): FeatureFlags {
  const tier = (process.env.PAYMENT_TIER as PaymentTier) || "starter";
  const maxProductsEnv = process.env.MAX_PRODUCTS || "10";
  const isUnlimited = maxProductsEnv === "unlimited";

  return {
    tier,
    maxProducts: isUnlimited ? Infinity : parseInt(maxProductsEnv, 10),
    isUnlimitedProducts: isUnlimited,
    customDomainEnabled: process.env.CUSTOM_DOMAIN_ENABLED === "true",
    analyticsEnabled: process.env.ANALYTICS_ENABLED === "true",
    premiumThemesEnabled: process.env.PREMIUM_THEMES_ENABLED === "true",
    isPro: tier === "pro" || tier === "hosted",
    isHosted: tier === "hosted",
  };
}

/**
 * Server-side only: Get feature flags for use in Server Components.
 * This is identical to useFeatureFlags but named to clarify usage context.
 */
export function getFeatureFlags(): FeatureFlags {
  return useFeatureFlags();
}
