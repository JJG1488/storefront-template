"use client";

import Link from "next/link";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";
import { useCart } from "./CartContext";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const { addItem, items } = useCart();

  // Check how many of this product are already in cart
  const inCartQty = items.find((i) => i.product.id === product.id)?.quantity || 0;

  // Calculate available stock (null = unlimited)
  const stock = product.inventory_count;
  const isOutOfStock = stock !== null && stock !== undefined && stock === 0;
  const isLowStock = stock !== null && stock !== undefined && stock > 0 && stock <= 5;
  const canAdd = stock === null || stock === undefined || inCartQty < stock;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden group">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square overflow-hidden relative">
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
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Sold Out</span>
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
        {isLowStock && (
          <p className="text-orange-600 text-sm mt-1">Only {stock} left!</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          <button
            onClick={() => addItem(product)}
            disabled={isOutOfStock || !canAdd}
            className="px-4 py-2 bg-brand text-white rounded hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isOutOfStock ? "Sold Out" : !canAdd ? "Max in Cart" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
