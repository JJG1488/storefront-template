"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, CheckCircle, XCircle, Loader2 } from "lucide-react";

function RecoverCartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "already-recovered">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing recovery token");
      return;
    }

    recoverCart();
  }, [token]);

  async function recoverCart() {
    try {
      const res = await fetch(`/api/carts/recover?token=${token}`);
      const data = await res.json();

      if (res.status === 410) {
        // Cart already recovered
        setStatus("already-recovered");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Failed to recover cart");
        return;
      }

      // Restore cart to localStorage
      const cartItems = data.cartItems.map((item: {
        product_id: string;
        product_name: string;
        product_price: number;
        product_image: string | null;
        quantity: number;
        variant: {
          id: string;
          name: string;
          options: Record<string, string>;
          price_adjustment: number;
        } | null;
      }) => ({
        product: {
          id: item.product_id,
          name: item.product_name,
          price: item.product_price,
          images: item.product_image ? [item.product_image] : [],
        },
        quantity: item.quantity,
        variant: item.variant
          ? {
              id: item.variant.id,
              name: item.variant.name,
              options: item.variant.options,
              price_adjustment: item.variant.price_adjustment,
            }
          : undefined,
      }));

      localStorage.setItem("cart", JSON.stringify(cartItems));

      setStatus("success");

      // Redirect to cart after a short delay
      setTimeout(() => {
        router.push("/cart");
      }, 2000);
    } catch (error) {
      console.error("Cart recovery error:", error);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-brand mx-auto animate-spin mb-4" />
          <h1 className="text-xl font-bold mb-2">Recovering Your Cart</h1>
          <p className="text-gray-600">Please wait while we restore your items...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Cart Restored!</h1>
          <p className="text-gray-600 mb-6">
            Your cart has been restored. Redirecting you to checkout...
          </p>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-lg hover:opacity-90"
          >
            <ShoppingCart className="w-5 h-5" />
            Go to Cart Now
          </Link>
        </div>
      </div>
    );
  }

  if (status === "already-recovered") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Already Completed!</h1>
          <p className="text-gray-600 mb-6">
            This cart has already been recovered and the order was completed. Thank you for your
            purchase!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-lg hover:opacity-90"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-xl font-bold mb-2">Recovery Failed</h1>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-lg hover:opacity-90"
        >
          <ShoppingCart className="w-5 h-5" />
          Start Shopping
        </Link>
      </div>
    </div>
  );
}

export default function RecoverCartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <Loader2 className="w-12 h-12 text-brand mx-auto animate-spin mb-4" />
            <h1 className="text-xl font-bold mb-2">Loading...</h1>
          </div>
        </div>
      }
    >
      <RecoverCartContent />
    </Suspense>
  );
}
