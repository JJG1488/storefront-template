"use client";

import { useCart } from "@/components/CartContext";
import { useCustomerAuth } from "@/components/CustomerAuthContext";
import { formatPrice } from "@/data/products";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { CouponInput } from "@/components/CouponInput";
import { GiftCardInput, AppliedGiftCard } from "@/components/GiftCardInput";
import { AddressSelector } from "@/components/AddressSelector";

interface StockIssue {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  requested: number;
  available: number;
}

interface AppliedCoupon {
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const [loading, setLoading] = useState(false);
  const [stockErrors, setStockErrors] = useState<StockIssue[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Calculate discount amount based on current cart total
  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === "percentage"
      ? (total * appliedCoupon.discountValue) / 100
      : Math.min(appliedCoupon.discountValue, total)
    : 0;

  // Calculate gift card amount (applied after coupon discount)
  const afterCouponTotal = total - discountAmount;
  const giftCardAmount = appliedGiftCard
    ? Math.min(appliedGiftCard.applicableAmount, afterCouponTotal)
    : 0;

  const finalTotal = afterCouponTotal - giftCardAmount;

  const handleCheckout = async () => {
    setLoading(true);
    setStockErrors([]);

    try {
      // Get customer token for authenticated checkout
      const token = localStorage.getItem("customer_token");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include auth token if available
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            variantId: item.variant?.id || null,
            variantInfo: item.variant || null,
          })),
          couponCode: appliedCoupon?.code || null,
          giftCardCode: appliedGiftCard?.code || null,
          // Include saved address selection
          savedAddressId: selectedAddressId || null,
        }),
      });

      const data = await response.json();

      if (response.status === 409 && data.stockIssues) {
        // Stock validation failed
        setStockErrors(data.stockIssues);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if an item has a stock error
  const getStockError = (productId: string, variantId?: string) =>
    stockErrors.find(
      (e) => e.productId === productId && e.variantId === variantId
    );

  // Generate unique key for cart item
  const getItemKey = (productId: string, variantId?: string) =>
    variantId ? `${productId}:${variantId}` : productId;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart</h1>
        <p className="text-gray-600">Your cart is empty</p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors"
        >
          Continue Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      {stockErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-700 font-semibold mb-2">
            Some items have stock issues:
          </h3>
          <ul className="list-disc list-inside text-red-600 text-sm">
            {stockErrors.map((error) => (
              <li key={error.productId}>
                {error.productName}: Only {error.available} available (you have{" "}
                {error.requested} in cart)
              </li>
            ))}
          </ul>
          <p className="text-red-600 text-sm mt-2">
            Please adjust quantities before checking out.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const stockError = getStockError(item.product.id, item.variant?.id);
          const itemKey = getItemKey(item.product.id, item.variant?.id);
          // Calculate item price including variant adjustment
          const itemPrice = item.product.price + (item.variant?.price_adjustment || 0);
          return (
            <div
              key={itemKey}
              className={`p-4 border rounded-lg ${
                stockError ? "border-red-300 bg-red-50" : ""
              }`}
            >
              {/* Top row: Image + Product Info */}
              <div className="flex gap-4">
                {item.product.images[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{item.product.name}</h3>
                  {/* Show variant name if present */}
                  {item.variant && (
                    <p className="text-sm text-gray-500">{item.variant.name}</p>
                  )}
                  <p className="text-gray-600">{formatPrice(itemPrice)}</p>
                  {stockError && (
                    <p className="text-red-600 text-sm mt-1">
                      Only {stockError.available} in stock
                    </p>
                  )}
                  {!item.variant &&
                    item.product.track_inventory &&
                    item.product.inventory_count !== null &&
                    !stockError && (
                      <p className="text-gray-500 text-sm mt-1">
                        {item.product.inventory_count} in stock
                      </p>
                    )}
                </div>
              </div>

              {/* Bottom row: Quantity + Remove */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)
                    }
                    className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
                    aria-label={`Decrease quantity of ${item.product.name}`}
                  >
                    -
                  </button>
                  <span className="w-8 text-center" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)
                    }
                    disabled={
                      !item.variant &&
                      item.product.track_inventory &&
                      item.product.inventory_count !== null &&
                      item.quantity >= item.product.inventory_count
                    }
                    className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Increase quantity of ${item.product.name}`}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.product.id, item.variant?.id)}
                  className="flex items-center gap-1 text-red-500 hover:text-red-700 p-2 -mr-2"
                  aria-label={`Remove ${item.product.name} from cart`}
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-4">
        {/* Address Selection for Logged-in Customers */}
        {!authLoading && isAuthenticated && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <AddressSelector
              selectedAddressId={selectedAddressId}
              onSelect={setSelectedAddressId}
            />
          </div>
        )}

        {/* Coupon Input */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Have a coupon?</p>
          <CouponInput
            cartTotal={total}
            appliedCoupon={appliedCoupon}
            onApply={(coupon) => setAppliedCoupon({
              ...coupon,
              discountAmount: coupon.discountType === "percentage"
                ? (total * coupon.discountValue) / 100
                : Math.min(coupon.discountValue, total)
            })}
            onRemove={() => setAppliedCoupon(null)}
          />
        </div>

        {/* Gift Card Input */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Have a gift card?</p>
          <GiftCardInput
            cartTotal={afterCouponTotal}
            appliedGiftCard={appliedGiftCard}
            onApply={setAppliedGiftCard}
            onRemove={() => setAppliedGiftCard(null)}
          />
        </div>

        {/* Order Summary */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(total)}</span>
          </div>
          {appliedCoupon && discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({appliedCoupon.code})</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          {appliedGiftCard && giftCardAmount > 0 && (
            <div className="flex justify-between text-purple-600">
              <span>Gift Card ({appliedGiftCard.code})</span>
              <span>-{formatPrice(giftCardAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>{formatPrice(finalTotal)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading || stockErrors.length > 0}
            className="w-full mt-2 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : "Proceed to Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}
