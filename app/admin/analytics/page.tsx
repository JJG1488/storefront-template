"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { UpgradePrompt } from "@/components/UpgradePrompt";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalCustomers: number;
    repeatCustomers: number;
    conversionRate: number;
  };
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{ id: string; name: string; unitsSold: number; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  recentOrders: number;
  periodStart: string;
  periodEnd: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
  refunded: "#6b7280",
};

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 bg-brand/10 rounded-lg">
          <Icon className="w-6 h-6 text-brand" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center mt-4">
          <TrendingUp
            className={`w-4 h-4 mr-1 ${trend >= 0 ? "text-green-500" : "text-red-500 rotate-180"}`}
          />
          <span className={`text-sm font-medium ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500 ml-2">vs last period</span>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const flags = useFeatureFlags();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (!flags.analyticsEnabled) return;
    fetchAnalytics();
  }, [period, flags.analyticsEnabled]);

  async function fetchAnalytics() {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/analytics?days=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!data) return;

    const rows = [
      ["Date", "Revenue", "Orders"],
      ...data.revenueByDay.map((d) => [d.date, (d.revenue / 100).toFixed(2), d.orders.toString()]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${period}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Show upgrade prompt for non-Pro users
  if (!flags.analyticsEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <UpgradePrompt
          feature="Analytics Dashboard"
          description="Track sales performance, revenue trends, and customer insights with detailed charts and metrics. Upgrade to Pro to unlock analytics."
          variant="card"
        />
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-600 mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Format revenue data for charts
  const chartData = data.revenueByDay.map((d) => ({
    ...d,
    date: formatDate(d.date),
    revenueFormatted: d.revenue / 100,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-4">
          {/* Period selector */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  period === days
                    ? "bg-brand text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          {/* Actions */}
          <button
            onClick={fetchAnalytics}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.summary.totalRevenue)}
          icon={DollarSign}
          subtitle={`${period} day total`}
        />
        <StatCard
          title="Total Orders"
          value={data.summary.totalOrders.toString()}
          icon={ShoppingCart}
          subtitle={`${data.recentOrders} in last 7 days`}
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(data.summary.averageOrderValue)}
          icon={TrendingUp}
        />
        <StatCard
          title="Customers"
          value={data.summary.totalCustomers.toString()}
          icon={Users}
          subtitle={`${data.summary.repeatCustomers} repeat buyers`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                labelStyle={{ color: "#374151" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenueFormatted"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#6366f1" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Orders</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value: number) => [value, "Orders"]}
                labelStyle={{ color: "#374151" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          {data.topProducts.length > 0 ? (
            <div className="space-y-4">
              {data.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-brand">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.unitsSold} units sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No sales data yet</p>
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Order Status</h3>
          {data.ordersByStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.ordersByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {data.ordersByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {data.ordersByStatus.map((status, index) => (
                  <div key={status.status} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[status.status] || CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-xs text-gray-600 capitalize">
                      {status.status} ({status.count})
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No orders yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Calendar className="w-4 h-4" />
        <span>
          Data from {new Date(data.periodStart).toLocaleDateString()} to{" "}
          {new Date(data.periodEnd).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
