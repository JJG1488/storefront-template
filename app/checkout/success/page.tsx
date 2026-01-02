"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, Package, ArrowRight } from "lucide-react";
import { useCustomerAuth } from "@/components/CustomerAuthContext";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const orderCreatedRef = useRef(false);

  useEffect(() => {
    // Clear cart on successful checkout
    if (sessionId) {
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("storage"));
    }
  }, [sessionId]);

  // Create order from session (fallback if webhook didn't create it)
  useEffect(() => {
    async function createOrderFromSession() {
      if (!sessionId || orderCreatedRef.current) return;
      orderCreatedRef.current = true;

      try {
        const response = await fetch("/api/orders/from-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.alreadyExists) {
            console.log("Order already exists (created by webhook)");
          } else if (data.success) {
            console.log("Order created via fallback:", data.orderId);
          }
        }
      } catch (error) {
        console.error("Failed to create order from session:", error);
      }
    }

    createOrderFromSession();
  }, [sessionId]);

  // Show account prompt for guests after a brief delay
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
        setShowAccountPrompt(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      {/* Success Message */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2">Thank you for your order!</h1>
        <p className="text-gray-600">
          Your order has been confirmed. You will receive an email confirmation
          shortly.
        </p>
      </div>

      {/* Account Prompt for Guests */}
      {showAccountPrompt && !isAuthenticated && (
        <div className="mb-8 p-6 bg-gradient-to-br from-brand/5 to-brand/10 rounded-2xl border border-brand/20">
          <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-brand" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Create an Account
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            Track your order, view order history, and save your addresses for faster checkout next time.
          </p>
          <Link
            href="/account/register"
            className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Create Account
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-500 mt-3">
            Already have an account?{" "}
            <Link href="/account/login" className="text-brand hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      )}

      {/* Logged In User - Show Order History Link */}
      {isAuthenticated && (
        <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
          <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-brand" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Track Your Order
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            View your order status and tracking information in your account.
          </p>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            View Orders
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Continue Shopping */}
      <Link
        href="/"
        className="inline-block px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p>Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
