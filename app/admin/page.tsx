"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          href="/admin/products"
        />
        <StatCard
          title="Low Stock"
          value={stats?.lowStockProducts ?? 0}
          href="/admin/products?filter=low-stock"
          alert={stats?.lowStockProducts ? stats.lowStockProducts > 0 : false}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          href="/admin/orders"
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          href="/admin/orders?status=pending"
          alert={stats?.pendingOrders ? stats.pendingOrders > 0 : false}
        />
      </div>

      {stats?.revenue !== undefined && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-600">Total Revenue</h2>
          <p className="text-3xl font-bold mt-2">
            ${((stats.revenue || 0) / 100).toFixed(2)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
  alert,
}: {
  title: string;
  value: number;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow ${
        alert ? "border-l-4 border-orange-500" : ""
      }`}
    >
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </Link>
  );
}

function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
      <div className="space-y-3">
        <Link
          href="/admin/products/new"
          className="block w-full text-center py-3 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors"
        >
          Add New Product
        </Link>
        <Link
          href="/admin/orders?status=pending"
          className="block w-full text-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          View Pending Orders
        </Link>
        <Link
          href="/admin/products?filter=low-stock"
          className="block w-full text-center py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Check Low Stock Items
        </Link>
      </div>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
      <p className="text-gray-500 text-sm">
        Activity feed will show recent orders and inventory changes.
      </p>
    </div>
  );
}
