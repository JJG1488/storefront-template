"use client";

import { useState } from "react";
import { useCart, VariantInfo } from "./CartContext";
import type { Product } from "@/data/products";

interface Props {
  product: Product;
  lowStockThreshold?: number;
  selectedVariant?: VariantInfo | null;
  variantStock?: number | null;
  variantTrackInventory?: boolean;
}

export function AddToCartButton({
  product,
  lowStockThreshold = 5,
  selectedVariant,
  variantStock,
  variantTrackInventory,
}: Props) {
  const { addItem, getItemQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Use variant stock if variant is selected, otherwise use product stock
  const hasVariants = selectedVariant !== undefined;
  const trackInventory = hasVariants
    ? (variantTrackInventory ?? false)
    : (product.track_inventory ?? false);
  const stock = hasVariants ? variantStock : product.inventory_count;

  // Get quantity already in cart for this product+variant combination
  const inCartQty = getItemQuantity(product.id, selectedVariant?.id);
  const availableToAdd = trackInventory && stock !== null && stock !== undefined
    ? stock - inCartQty
    : Infinity;
  const isOutOfStock = trackInventory && stock !== null && stock !== undefined && stock === 0;
  const isLowStock = trackInventory && stock !== null && stock !== undefined && stock > 0 && stock <= lowStockThreshold;

  // Check if variant is required but not selected
  const needsVariantSelection = hasVariants && selectedVariant === null;

  const handleAdd = () => {
    if (quantity > availableToAdd || needsVariantSelection) {
      return;
    }
    addItem(product, quantity, selectedVariant || undefined);
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 2000);
  };

  // Limit quantity to available stock
  const maxQuantity = availableToAdd === Infinity ? 99 : Math.max(0, availableToAdd);

  return (
    <div className="space-y-4">
      {isLowStock && (
        <p className="text-orange-600 font-medium">Only {stock} left in stock!</p>
      )}
      {inCartQty > 0 && stock !== null && stock !== undefined && (
        <p className="text-gray-600 text-sm">
          {inCartQty} already in cart ({availableToAdd} more available)
        </p>
      )}

      <div className="flex items-center gap-4">
        <label className="text-gray-600">Quantity:</label>
        <div className="flex items-center">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="px-3 py-2 border rounded-l disabled:opacity-50"
          >
            -
          </button>
          <span className="px-4 py-2 border-t border-b min-w-[3rem] text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={quantity >= maxQuantity}
            className="px-3 py-2 border rounded-r disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={isOutOfStock || availableToAdd <= 0 || needsVariantSelection}
        className="w-full py-3 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {needsVariantSelection
          ? "Select Options"
          : isOutOfStock
          ? "Sold Out"
          : availableToAdd <= 0
          ? "Maximum in Cart"
          : added
          ? "Added to Cart!"
          : "Add to Cart"}
      </button>
    </div>
  );
}
