"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Download,
} from "lucide-react";
import { useCustomerAuth } from "@/components/CustomerAuthContext";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  variant_info: Record<string, string> | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  download_url: string | null;
}

interface Order {
  id: string;
  order_number: number;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping_address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null;
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
  shipped_at: string | null;
  customer_notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const statusConfig = {
  pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", label: "Pending" },
  processing: { icon: Package, color: "text-blue-500", bg: "bg-blue-50", label: "Processing" },
  shipped: { icon: Truck, color: "text-blue-500", bg: "bg-blue-50", label: "Shipped" },
  delivered: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", label: "Delivered" },
  cancelled: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Cancelled" },
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/account/login?redirect=/account/orders/${orderId}`);
    }
  }, [isLoading, isAuthenticated, router, orderId]);

  useEffect(() => {
    async function fetchOrder() {
      const token = localStorage.getItem("customer_token");
      if (!token) return;

      try {
        const res = await fetch(`/api/customer/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        } else if (res.status === 404) {
          setError("Order not found");
        } else if (res.status === 403) {
          setError("You do not have permission to view this order");
        } else {
          setError("Failed to load order");
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError("Failed to load order");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchOrder();
    }
  }, [isAuthenticated, orderId]);

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

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <Link
            href="/account/orders"
            className="text-brand font-medium hover:underline"
          >
            View all orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Order #{order.order_number}
          </h1>
          <p className="text-gray-600 mt-1">
            Placed on{" "}
            {new Date(order.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${status.bg}`}>
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
          <span className={`font-medium ${status.color}`}>{status.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Items</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.order_items.map((item) => (
                <div key={item.id} className="p-6 flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {item.product_name}
                    </h3>
                    {item.variant_info && Object.keys(item.variant_info).length > 0 && (
                      <p className="text-sm text-gray-500 mb-2">
                        {Object.entries(item.variant_info)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(", ")}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    {item.download_url && (
                      <a
                        href={`/api/download/${item.download_url}`}
                        className="inline-flex items-center gap-1 mt-2 text-sm text-brand hover:underline"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${(item.total_price / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking */}
          {order.tracking_number && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Tracking</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-brand" />
                  <span className="font-mono text-gray-700">{order.tracking_number}</span>
                </div>
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-brand font-medium hover:underline"
                  >
                    Track Package
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              {order.shipped_at && (
                <p className="text-sm text-gray-500 mt-3">
                  Shipped on{" "}
                  {new Date(order.shipped_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">${(order.subtotal / 100).toFixed(2)}</span>
              </div>
              {order.shipping_cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-gray-900">${(order.shipping_cost / 100).toFixed(2)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">${(order.tax_amount / 100).toFixed(2)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Discount
                    {order.coupon_code && ` (${order.coupon_code})`}
                  </span>
                  <span>-${(order.discount_amount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-100 text-base font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">${(order.total / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <address className="text-sm text-gray-600 not-italic">
                <p className="font-medium text-gray-900">{order.customer_name}</p>
                {order.shipping_address.line1 && <p>{order.shipping_address.line1}</p>}
                {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                <p>
                  {order.shipping_address.city}
                  {order.shipping_address.state && `, ${order.shipping_address.state}`}{" "}
                  {order.shipping_address.postal_code}
                </p>
                {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
              </address>
            </div>
          )}

          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{order.customer_email}</p>
              {order.customer_phone && <p>{order.customer_phone}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
