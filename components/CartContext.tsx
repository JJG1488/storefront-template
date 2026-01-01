"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Product } from "@/data/products";

export interface VariantInfo {
  id: string;
  name: string;
  sku?: string;
  price_adjustment: number;
  options: Record<string, string>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: VariantInfo;
}

// Generate unique cart key for product+variant combination
function getCartKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}:${variantId}` : productId;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: VariantInfo) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  getItemQuantity: (productId: string, variantId?: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        // Invalid cart data
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1, variant?: VariantInfo) => {
    setItems((prev) => {
      const itemKey = getCartKey(product.id, variant?.id);
      const existing = prev.find(
        (item) => getCartKey(item.product.id, item.variant?.id) === itemKey
      );
      if (existing) {
        return prev.map((item) =>
          getCartKey(item.product.id, item.variant?.id) === itemKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, variant }];
    });
  };

  const removeItem = (productId: string, variantId?: string) => {
    const itemKey = getCartKey(productId, variantId);
    setItems((prev) =>
      prev.filter(
        (item) => getCartKey(item.product.id, item.variant?.id) !== itemKey
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    const itemKey = getCartKey(productId, variantId);
    setItems((prev) =>
      prev.map((item) =>
        getCartKey(item.product.id, item.variant?.id) === itemKey
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (productId: string, variantId?: string): number => {
    const itemKey = getCartKey(productId, variantId);
    const item = items.find(
      (i) => getCartKey(i.product.id, i.variant?.id) === itemKey
    );
    return item?.quantity || 0;
  };

  // Calculate total including variant price adjustments
  const total = items.reduce((sum, item) => {
    const priceAdjustment = item.variant?.price_adjustment || 0;
    const itemPrice = item.product.price + priceAdjustment;
    return sum + itemPrice * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
