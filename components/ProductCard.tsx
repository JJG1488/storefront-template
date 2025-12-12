"use client";

import Link from "next/link";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";
import { useCart } from "./CartContext";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const { addItem } = useCart();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden group">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square overflow-hidden">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold hover:text-brand">{product.name}</h3>
        </Link>
        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          <button
            onClick={() => addItem(product)}
            disabled={product.inventory_count === 0}
            className="px-4 py-2 bg-brand text-white rounded hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {product.inventory_count === 0 ? "Sold Out" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
