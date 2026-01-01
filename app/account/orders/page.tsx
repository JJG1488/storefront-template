"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Loader2, ShoppingBag, Package } from "lucide-react";
import { useCustomerAuth } from "@/components/CustomerAuthContext";

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  order_number: number;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  coupon_code: string | null;
  total: number;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/account/login?redirect=/account/orders");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    async function fetchOrders() {
      const token = localStorage.getItem("customer_token");
      if (!token) return;

      try {
        const res = await fetch("/api/customer/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Account
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        <p className="text-gray-600 mt-2">
          View and track all your orders
        </p>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">
            When you place an order, it will appear here.
          </p>
          <Link
            href="/"
            className="inline-block bg-brand text-white px-6 py-3 rounded-lg font-medium hover:opacity-90"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block bg-white rounded-xl border border-gray-100 p-6 hover:border-brand hover:shadow-sm transition-all"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      Order #{order.order_number}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "shipped"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900 text-lg">
                    ${(order.total / 100).toFixed(2)}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 hidden sm:block" />
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div className="flex -space-x-2">
                  {order.order_items.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id}
                      className="w-10 h-10 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden"
                      style={{ zIndex: 3 - idx }}
                    >
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  ))}
                  {order.order_items.length > 3 && (
                    <div className="w-10 h-10 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      +{order.order_items.length - 3}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {order.order_items.length} item
                  {order.order_items.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Tracking Info */}
              {order.tracking_number && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                  Tracking: {order.tracking_number}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
