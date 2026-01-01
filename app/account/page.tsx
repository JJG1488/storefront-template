"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Package,
  MapPin,
  LogOut,
  ChevronRight,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { useCustomerAuth } from "@/components/CustomerAuthContext";

interface Order {
  id: string;
  order_number: number;
  status: string;
  total: number;
  created_at: string;
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
  }>;
}

export default function AccountPage() {
  const router = useRouter();
  const { customer, isAuthenticated, isLoading, logout } = useCustomerAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/account/login");
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
          // Only show the 3 most recent orders on dashboard
          setRecentOrders(data.orders.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const displayName = customer?.firstName
    ? `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ""}`
    : customer?.email || "Customer";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        <p className="text-gray-600 mt-2">Welcome back, {displayName}</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Link
          href="/account/orders"
          className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-100 hover:border-brand hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-brand" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Orders</h3>
            <p className="text-sm text-gray-500">View order history</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        <Link
          href="/account/addresses"
          className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-100 hover:border-brand hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center">
            <MapPin className="w-6 h-6 text-brand" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Addresses</h3>
            <p className="text-sm text-gray-500">Manage saved addresses</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        <Link
          href="/account/profile"
          className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-100 hover:border-brand hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-brand" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Profile</h3>
            <p className="text-sm text-gray-500">Update your info</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          <Link href="/account/orders" className="text-brand font-medium hover:underline">
            View All
          </Link>
        </div>

        {loadingOrders ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : recentOrders.length === 0 ? (
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
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
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
                    {" - "}
                    {order.order_items.length} item
                    {order.order_items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">
                    ${(order.total / 100).toFixed(2)}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Account Actions */}
      <div className="border-t border-gray-100 pt-8">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
