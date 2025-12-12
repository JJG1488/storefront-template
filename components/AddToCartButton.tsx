"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import type { Product } from "@/data/products";

interface Props {
  product: Product;
}

export function AddToCartButton({ product }: Props) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-gray-600">Quantity:</label>
        <div className="flex items-center">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 border rounded-l"
          >
            -
          </button>
          <span className="px-4 py-2 border-t border-b">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-2 border rounded-r"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={handleAdd}
        className="w-full py-3 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity"
      >
        {added ? "Added to Cart!" : "Add to Cart"}
      </button>
    </div>
  );
}
