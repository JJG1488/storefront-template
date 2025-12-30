"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");

  useEffect(() => {
    async function loadOrders() {
      try {
        const token = localStorage.getItem("admin_token");
        const url = statusFilter
          ? `/api/admin/orders?status=${statusFilter}`
          : "/api/admin/orders";

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setOrders(await res.json());
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [statusFilter]);

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Orders {statusFilter && `(${statusFilter})`}
        </h1>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/admin/orders"
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            !statusFilter
              ? "bg-brand text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        {["pending", "processing", "shipped", "delivered", "cancelled"].map(
          (status) => (
            <Link
              key={status}
              href={`/admin/orders?status=${status}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                statusFilter === status
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status}
            </Link>
          )
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            {statusFilter ? `No ${statusFilter} orders` : "No orders yet"}
          </p>
        </div>
      ) : (
        <>
        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/admin/orders/${order.id}`)}
              className="bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs capitalize ${
                    STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="font-medium">{order.customer_name}</div>
              <div className="text-sm text-gray-500">{order.customer_email}</div>
              <div className="flex justify-between items-center mt-3 text-sm">
                <span className="text-gray-500">{order.order_items?.length || 0} items</span>
                <span className="font-medium">${((order.total || 0) / 100).toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {new Date(order.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">
                      #{order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">
                        {order.customer_email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {order.order_items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 font-medium">
                    ${((order.total || 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs capitalize ${
                        STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-brand hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
