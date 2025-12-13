"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price_at_time: number;
}

interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  shipping_address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  notes: string | null;
  tracking_number: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load order");
        }

        const data: Order = await res.json();
        setOrder(data);
        setStatus(data.status);
        setTrackingNumber(data.tracking_number || "");
        setNotes(data.notes || "");
      } catch (err) {
        console.error("Failed to load order:", err);
        setError("Failed to load order");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          tracking_number: trackingNumber || null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update order");
      }

      const updated = await res.json();
      setOrder({ ...order!, ...updated });
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to update order");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendNotification() {
    setSendingNotification(true);
    setNotificationMessage(null);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/orders/${orderId}/notify-shipped`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackingUrl: trackingNumber ? null : undefined, // Could add tracking URL field later
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send notification");
      }

      setNotificationMessage({
        type: "success",
        text: "Shipping notification sent to customer!",
      });

      // Update local status if it changed
      if (order && order.status !== "shipped" && order.status !== "delivered") {
        setStatus("shipped");
        setOrder({ ...order, status: "shipped" });
      }
    } catch (err) {
      console.error("Notification error:", err);
      setNotificationMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to send notification",
      });
    } finally {
      setSendingNotification(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Order not found</p>
        <Link href="/admin/orders" className="text-brand hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Order #{order.id.slice(0, 8)}
        </h1>
        <Link
          href="/admin/orders"
          className="text-gray-600 hover:text-gray-900"
        >
          &larr; Back to Orders
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">Order Items</h2>
            <div className="divide-y">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-gray-500">
                      Qty: {item.quantity} @ $
                      {(item.price_at_time / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="font-medium">
                    ${((item.price_at_time * item.quantity) / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>${((order.subtotal || 0) / 100).toFixed(2)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span>${(order.tax / 100).toFixed(2)}</span>
                </div>
              )}
              {order.shipping_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span>${(order.shipping_cost / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${((order.total || 0) / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">Shipping Address</h2>
            {order.shipping_address ? (
              <div className="text-gray-700">
                <div className="font-medium">{order.customer_name}</div>
                {order.shipping_address.line1 && (
                  <div>{order.shipping_address.line1}</div>
                )}
                {order.shipping_address.line2 && (
                  <div>{order.shipping_address.line2}</div>
                )}
                <div>
                  {order.shipping_address.city}
                  {order.shipping_address.state &&
                    `, ${order.shipping_address.state}`}{" "}
                  {order.shipping_address.postal_code}
                </div>
                {order.shipping_address.country && (
                  <div>{order.shipping_address.country}</div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No shipping address</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">Customer</h2>
            <div>
              <div className="font-medium">{order.customer_name}</div>
              <div className="text-sm text-gray-500">{order.customer_email}</div>
            </div>
          </div>

          {/* Order Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">Update Order</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal notes"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2 bg-brand text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              {/* Shipping Notification */}
              <div className="border-t pt-4 mt-4">
                <button
                  onClick={handleSendNotification}
                  disabled={sendingNotification || status === "cancelled"}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sendingNotification ? (
                    "Sending..."
                  ) : (
                    <>
                      <span>&#128230;</span>
                      Send Shipping Notification
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Sends email to customer with tracking info
                </p>

                {notificationMessage && (
                  <div
                    className={`mt-3 p-3 rounded-lg text-sm ${
                      notificationMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {notificationMessage.text}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">Timeline</h2>
            <div className="text-sm text-gray-500">
              <div>
                Created: {new Date(order.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
