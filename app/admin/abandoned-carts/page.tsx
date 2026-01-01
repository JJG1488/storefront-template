"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Mail, Clock, RefreshCw, Filter, CheckCircle } from "lucide-react";

interface AbandonedCart {
  id: string;
  customer: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  items: Array<{
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
  }>;
  total: number;
  emailSentAt: string | null;
  abandonedAt: string;
  createdAt: string;
}

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [minAge, setMinAge] = useState("1");
  const [includeEmailed, setIncludeEmailed] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCarts();
  }, [minAge, includeEmailed]);

  async function fetchCarts() {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const params = new URLSearchParams({
        minAge,
        includeEmailed: includeEmailed.toString(),
      });

      const res = await fetch(`/api/admin/abandoned-carts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCarts(data.carts);
      }
    } catch (error) {
      console.error("Failed to fetch abandoned carts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function sendRecoveryEmail(cartId: string) {
    setSendingEmail(cartId);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/abandoned-carts/${cartId}/send-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSuccessMessage("Recovery email sent successfully!");
        // Refresh carts to show updated email sent status
        fetchCarts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Failed to send recovery email:", error);
      alert("Failed to send recovery email");
    } finally {
      setSendingEmail(null);
    }
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    }
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  }

  function formatCurrency(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Abandoned Carts
          </h1>
          <p className="text-gray-600 mt-1">
            Send recovery emails to customers who left without purchasing
          </p>
        </div>

        <button
          onClick={fetchCarts}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="minAge" className="text-sm text-gray-600">
                Abandoned at least:
              </label>
              <select
                id="minAge"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="1">1 hour ago</option>
                <option value="2">2 hours ago</option>
                <option value="4">4 hours ago</option>
                <option value="24">24 hours ago</option>
                <option value="48">48 hours ago</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={includeEmailed}
                onChange={(e) => setIncludeEmailed(e.target.checked)}
                className="rounded border-gray-300"
              />
              Include already emailed
            </label>
          </div>
        </div>
      </div>

      {/* Carts list */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Loading abandoned carts...
        </div>
      ) : carts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No abandoned carts found</p>
          <p className="text-sm text-gray-400 mt-1">
            Carts from logged-in customers will appear here after they&apos;ve been
            idle for the selected time period
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {carts.map((cart) => (
            <div key={cart.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {cart.customer?.name || cart.customer?.email || "Unknown"}
                  </div>
                  <div className="text-sm text-gray-500">{cart.customer?.email}</div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {formatTimeAgo(cart.abandonedAt)}
                  </div>

                  {cart.emailSentAt ? (
                    <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <Mail className="w-4 h-4" />
                      Emailed {formatTimeAgo(cart.emailSentAt)}
                    </div>
                  ) : (
                    <button
                      onClick={() => sendRecoveryEmail(cart.id)}
                      disabled={sendingEmail === cart.id}
                      className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
                    >
                      <Mail className="w-4 h-4" />
                      {sendingEmail === cart.id ? "Sending..." : "Send Recovery Email"}
                    </button>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="p-4">
                <div className="space-y-3">
                  {cart.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.product_name}</div>
                        {item.variant && (
                          <div className="text-sm text-gray-500">{item.variant.name}</div>
                        )}
                      </div>

                      <div className="text-sm text-gray-500">x{item.quantity}</div>

                      <div className="font-medium">
                        {formatCurrency(
                          (item.product_price + (item.variant?.price_adjustment || 0)) *
                            item.quantity
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-gray-600">Cart Total</span>
                  <span className="text-lg font-bold">{formatCurrency(cart.total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
