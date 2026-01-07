"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Eye, Download } from "lucide-react";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";

interface Props {
  product: Product;
  showQuickAdd?: boolean;
}

export function ProductCard({ product, showQuickAdd = true }: Props) {
  const { addItem, items } = useCart();
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const [imageHovered, setImageHovered] = useState(false);

  // Check how many of this product are already in cart
  const inCartQty = items.find((i) => i.product.id === product.id)?.quantity || 0;

  // Digital products don't have stock limits
  const isDigital = product.is_digital;

  // Calculate available stock (null = unlimited, digital products always available)
  const stock = product.inventory_count;
  const isOutOfStock = !isDigital && stock !== null && stock !== undefined && stock === 0;
  const isLowStock = !isDigital && stock !== null && stock !== undefined && stock > 0 && stock <= 5;
  const canAdd = isDigital || stock === null || stock === undefined || inCartQty < stock;

  // Check if product has multiple images for hover effect
  const hasSecondImage = product.images.length > 1;
  const displayImage = imageHovered && hasSecondImage ? product.images[1] : product.images[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canAdd && !isOutOfStock) {
      addItem(product);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden group border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
      {/* Image Container */}
      <Link href={`/products/${product.id}`}>
        <div
          className="aspect-square overflow-hidden relative"
          onMouseEnter={() => setImageHovered(true)}
          onMouseLeave={() => setImageHovered(false)}
        >
          {product.images[0] ? (
            <>
              <img
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              />
              {/* Second image hint indicator */}
              {hasSecondImage && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${!imageHovered ? 'bg-white' : 'bg-white/50'}`} />
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${imageHovered ? 'bg-white' : 'bg-white/50'}`} />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isDigital && (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded flex items-center gap-1">
                <Download className="w-3 h-3" />
                Digital
              </span>
            )}
            {isOutOfStock && (
              <span className="px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded">
                Sold Out
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded">
                Only {stock} left
              </span>
            )}
            {/* Future: Sale badge when compare_at_price is higher */}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>

          {/* Quick Actions Overlay */}
          {showQuickAdd && !isOutOfStock && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <button
                  onClick={handleQuickAdd}
                  disabled={!canAdd}
                  className="flex-1 py-2.5 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {!canAdd ? "Max Added" : "Quick Add"}
                </button>
                <Link
                  href={`/products/${product.id}`}
                  className="w-10 h-10 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="w-4 h-4 text-gray-700" />
                </Link>
              </div>
            </div>
          )}

          {/* Sold Out Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-brand transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2 min-h-[2.5rem]">
          {product.description}
        </p>

        {/* Price and Add Button */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {/* Future: Show compare_at_price here */}
          </div>
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock || !canAdd}
            className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-hover active:bg-brand-active disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isOutOfStock ? "Sold Out" : !canAdd ? "Max" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
