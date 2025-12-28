/**
 * Feature flags hook for tier-based feature gating.
 *
 * Environment variables are set during deployment based on the store's payment tier.
 * IMPORTANT: All tier env vars use NEXT_PUBLIC_ prefix to be available in client components.
 *
 * - NEXT_PUBLIC_PAYMENT_TIER: "starter" | "pro" | "hosted"
 * - NEXT_PUBLIC_MAX_PRODUCTS: "10" | "unlimited"
 * - NEXT_PUBLIC_CUSTOM_DOMAIN_ENABLED: "true" | "false"
 * - NEXT_PUBLIC_ANALYTICS_ENABLED: "true" | "false"
 * - NEXT_PUBLIC_PREMIUM_THEMES_ENABLED: "true" | "false"
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
  const tier = (process.env.NEXT_PUBLIC_PAYMENT_TIER as PaymentTier) || "starter";
  const maxProductsEnv = process.env.NEXT_PUBLIC_MAX_PRODUCTS || "10";
  const isUnlimited = maxProductsEnv === "unlimited";

  return {
    tier,
    maxProducts: isUnlimited ? Infinity : parseInt(maxProductsEnv, 10),
    isUnlimitedProducts: isUnlimited,
    customDomainEnabled: process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_ENABLED === "true",
    analyticsEnabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
    premiumThemesEnabled: process.env.NEXT_PUBLIC_PREMIUM_THEMES_ENABLED === "true",
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
