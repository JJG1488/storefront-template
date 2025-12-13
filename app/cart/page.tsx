"use client";

import { useCart } from "@/components/CartContext";
import { formatPrice } from "@/data/products";
import { useState } from "react";

interface StockIssue {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const [loading, setLoading] = useState(false);
  const [stockErrors, setStockErrors] = useState<StockIssue[]>([]);

  const handleCheckout = async () => {
    setLoading(true);
    setStockErrors([]);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
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
  const getStockError = (productId: string) =>
    stockErrors.find((e) => e.productId === productId);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart</h1>
        <p className="text-gray-600">Your cart is empty</p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-3 bg-brand text-white rounded-lg hover:opacity-90"
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
          const stockError = getStockError(item.product.id);
          return (
            <div
              key={item.product.id}
              className={`flex items-center gap-4 p-4 border rounded-lg ${
                stockError ? "border-red-300 bg-red-50" : ""
              }`}
            >
              {item.product.images[0] && (
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{item.product.name}</h3>
                <p className="text-gray-600">{formatPrice(item.product.price)}</p>
                {stockError && (
                  <p className="text-red-600 text-sm mt-1">
                    Only {stockError.available} in stock
                  </p>
                )}
                {item.product.inventory_count !== null &&
                  item.product.inventory_count !== undefined &&
                  !stockError && (
                    <p className="text-gray-500 text-sm mt-1">
                      {item.product.inventory_count} in stock
                    </p>
                  )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity - 1)
                  }
                  className="px-3 py-1 border rounded hover:bg-gray-100"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity + 1)
                  }
                  disabled={
                    item.product.inventory_count !== null &&
                    item.product.inventory_count !== undefined &&
                    item.quantity >= item.product.inventory_count
                  }
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.product.id)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading || stockErrors.length > 0}
          className="w-full mt-4 py-3 bg-brand text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Proceed to Checkout"}
        </button>
      </div>
    </div>
  );
}
