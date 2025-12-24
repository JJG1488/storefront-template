/**
 * Product-related utilities including tier-based product limits.
 *
 * Starter tier: Maximum 10 products
 * Pro/Hosted tiers: Unlimited products
 */

import { getFeatureFlags } from "@/hooks/useFeatureFlags";

/**
 * Check if the store can add more products based on tier limits.
 *
 * @param currentCount - Current number of products in the store
 * @returns boolean - True if more products can be added
 */
export function canAddProduct(currentCount: number): boolean {
  const { isUnlimitedProducts, maxProducts } = getFeatureFlags();

  if (isUnlimitedProducts) {
    return true;
  }

  return currentCount < maxProducts;
}

/**
 * Get the maximum number of products allowed for this store.
 *
 * @returns number | null - The limit, or null if unlimited
 */
export function getProductLimit(): number | null {
  const { isUnlimitedProducts, maxProducts } = getFeatureFlags();

  if (isUnlimitedProducts) {
    return null;
  }

  return maxProducts;
}

/**
 * Get the number of remaining products that can be added.
 *
 * @param currentCount - Current number of products in the store
 * @returns number | null - Remaining slots, or null if unlimited
 */
export function getRemainingProductSlots(currentCount: number): number | null {
  const { isUnlimitedProducts, maxProducts } = getFeatureFlags();

  if (isUnlimitedProducts) {
    return null;
  }

  return Math.max(0, maxProducts - currentCount);
}

/**
 * Get a message describing the product limit status.
 *
 * @param currentCount - Current number of products in the store
 * @returns string - User-friendly message about product limits
 */
export function getProductLimitMessage(currentCount: number): string {
  const { isUnlimitedProducts, maxProducts, tier } = getFeatureFlags();

  if (isUnlimitedProducts) {
    return `${currentCount} products`;
  }

  const remaining = maxProducts - currentCount;

  if (remaining <= 0) {
    return `${maxProducts}/${maxProducts} products (limit reached)`;
  }

  if (remaining <= 3) {
    return `${currentCount}/${maxProducts} products (${remaining} remaining)`;
  }

  return `${currentCount}/${maxProducts} products`;
}
