"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
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

// Token key matches CustomerAuthContext
const CUSTOMER_TOKEN_KEY = "customer_token";

// Debounce delay for cart sync (2 seconds)
const SYNC_DEBOUNCE_MS = 2000;

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
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  // Use ref to always sync latest items, preventing stale closure issues
  const latestItemsRef = useRef<CartItem[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  // Sync cart to server (for logged-in customers only)
  const syncCartToServer = useCallback(async () => {
    // Only sync if customer is logged in
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (!token) return;

    // Use ref to get latest items, avoiding stale closure
    const cartItems = latestItemsRef.current;

    try {
      await fetch("/api/carts/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: cartItems }),
      });
    } catch (error) {
      // Silently fail - cart sync is best-effort
      console.log("Cart sync failed:", error);
    }
  }, []);

  // Debounced sync function
  const debouncedSync = useCallback(() => {
    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Set new timeout - syncCartToServer reads from ref for latest items
    syncTimeoutRef.current = setTimeout(() => {
      syncCartToServer();
    }, SYNC_DEBOUNCE_MS);
  }, [syncCartToServer]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

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
    isInitialLoadRef.current = false;
  }, []);

  // Save cart to localStorage on change and sync to server
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));

    // Don't sync on initial load (cart is already synced server-side)
    if (!isInitialLoadRef.current) {
      debouncedSync();
    }
  }, [items, debouncedSync]);

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
