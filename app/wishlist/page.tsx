"use client";

import { useWishlist } from "@/components/WishlistContext";
import { useCart } from "@/components/CartContext";
import { formatPrice } from "@/data/products";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();

  const handleAddToCart = (product: (typeof items)[0]) => {
    addToCart(product, 1);
    removeItem(product.id);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Your Wishlist</h1>
        <p className="text-gray-600 mb-6">
          Save items you love to your wishlist and come back to them anytime.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Wishlist</h1>
          <p className="text-gray-600 mt-1">
            {items.length} {items.length === 1 ? "item" : "items"} saved
          </p>
        </div>
        <button
          onClick={clearWishlist}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden group"
          >
            {/* Product Image */}
            <Link href={`/products/${product.id}`} className="block relative">
              <div className="aspect-square bg-gray-100 relative">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeItem(product.id);
                }}
                className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
                aria-label="Remove from wishlist"
              >
                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
              </button>
            </Link>

            {/* Product Info */}
            <div className="p-4">
              <Link
                href={`/products/${product.id}`}
                className="block hover:text-brand transition-colors"
              >
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                  {product.name}
                </h3>
              </Link>
              <p className="text-lg font-bold text-brand mb-4">
                {formatPrice(product.price)}
              </p>

              {/* Stock Status */}
              {product.track_inventory && product.inventory_count !== null && (
                <div className="mb-4">
                  {product.inventory_count === 0 ? (
                    <span className="text-sm text-red-600">Out of stock</span>
                  ) : product.inventory_count <= 5 ? (
                    <span className="text-sm text-orange-600">
                      Only {product.inventory_count} left
                    </span>
                  ) : (
                    <span className="text-sm text-green-600">In stock</span>
                  )}
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(product)}
                disabled={
                  product.track_inventory && product.inventory_count === 0
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Continue Shopping */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
