"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import type { Product } from "@/data/products";

interface Props {
  product: Product;
}

export function AddToCartButton({ product }: Props) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Calculate available stock
  const stock = product.inventory_count;
  const inCartQty = items.find((i) => i.product.id === product.id)?.quantity || 0;
  const availableToAdd = stock !== null && stock !== undefined ? stock - inCartQty : Infinity;
  const isOutOfStock = stock !== null && stock !== undefined && stock === 0;
  const isLowStock = stock !== null && stock !== undefined && stock > 0 && stock <= 5;

  const handleAdd = () => {
    if (quantity > availableToAdd) {
      return;
    }
    addItem(product, quantity);
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
        disabled={isOutOfStock || availableToAdd <= 0}
        className="w-full py-3 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isOutOfStock
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
