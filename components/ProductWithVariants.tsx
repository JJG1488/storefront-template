"use client";

import { useState, useCallback } from "react";
import { AddToCartButton } from "./AddToCartButton";
import { VariantSelector, Variant } from "./VariantSelector";
import { VariantInfo } from "./CartContext";
import type { Product } from "@/data/products";

interface Props {
  product: Product;
  lowStockThreshold: number;
}

export function ProductWithVariants({ product, lowStockThreshold }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [displayPrice, setDisplayPrice] = useState(product.price);
  const [hasLoadedVariants, setHasLoadedVariants] = useState(false);

  const handleVariantChange = useCallback(
    (variant: Variant | null, finalPrice: number) => {
      setSelectedVariant(variant);
      setDisplayPrice(finalPrice);
      setHasLoadedVariants(true);
    },
    []
  );

  // Convert Variant to VariantInfo for cart
  const variantInfo: VariantInfo | null = selectedVariant
    ? {
        id: selectedVariant.id,
        name: selectedVariant.name,
        sku: selectedVariant.sku,
        price_adjustment: selectedVariant.price_adjustment,
        options: selectedVariant.options,
      }
    : null;

  // Check if product has variants (for determining if we need variant selection)
  const productHasVariants = product.has_variants;

  return (
    <div>
      {/* Price display - updates based on selected variant */}
      <p className="text-2xl font-semibold text-brand mb-4">
        ${(displayPrice / 100).toFixed(2)}
      </p>

      <p className="text-gray-600 mb-6">{product.description}</p>

      {/* Variant selector */}
      <VariantSelector
        productId={product.id}
        basePrice={product.price}
        onVariantChange={handleVariantChange}
      />

      {/* Add to cart section */}
      {productHasVariants ? (
        // Product has variants - use variant stock and pass selected variant
        <AddToCartButton
          product={product}
          lowStockThreshold={lowStockThreshold}
          selectedVariant={hasLoadedVariants ? variantInfo : undefined}
          variantStock={selectedVariant?.inventory_count ?? null}
          variantTrackInventory={selectedVariant?.track_inventory ?? false}
        />
      ) : (
        // Regular product without variants
        !product.is_digital &&
        product.track_inventory &&
        product.inventory_count === 0 ? (
          <button
            disabled
            className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : (
          <AddToCartButton product={product} lowStockThreshold={lowStockThreshold} />
        )
      )}
    </div>
  );
}
