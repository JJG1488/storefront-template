import { NextRequest, NextResponse } from "next/server";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface DailyData {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
}

interface OrderStatusData {
  status: string;
  count: number;
}

interface AnalyticsResponse {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalCustomers: number;
    repeatCustomers: number;
    conversionRate: number;
  };
  revenueByDay: DailyData[];
  topProducts: TopProduct[];
  ordersByStatus: OrderStatusData[];
  recentOrders: number;
  periodStart: string;
  periodEnd: string;
}

export async function GET(request: NextRequest) {
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    // Get period from query params (default: 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);

    // Fetch all orders for the store
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        total,
        subtotal,
        customer_email,
        created_at,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price_at_time
        )
      `)
      .eq("store_id", storeId)
      .gte("created_at", periodStart.toISOString())
      .order("created_at", { ascending: true });

    if (ordersError) {
      console.error("Orders fetch error:", ordersError);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    const allOrders = orders || [];

    // Calculate summary metrics
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = allOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get unique customers and repeat customers
    const customerEmails = allOrders.map((o) => o.customer_email).filter(Boolean);
    const uniqueCustomers = new Set(customerEmails);
    const emailCounts: Record<string, number> = customerEmails.reduce((acc, email) => {
      acc[email] = (acc[email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const repeatCustomers = Object.values(emailCounts).filter((count: number) => count > 1).length;

    // Revenue by day
    const revenueByDayMap = new Map<string, { revenue: number; orders: number }>();

    // Initialize all days in the period
    for (let d = new Date(periodStart); d <= periodEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      revenueByDayMap.set(dateStr, { revenue: 0, orders: 0 });
    }

    // Fill in actual data
    allOrders.forEach((order) => {
      const dateStr = new Date(order.created_at).toISOString().split("T")[0];
      const existing = revenueByDayMap.get(dateStr) || { revenue: 0, orders: 0 };
      revenueByDayMap.set(dateStr, {
        revenue: existing.revenue + (order.total || 0),
        orders: existing.orders + 1,
      });
    });

    const revenueByDay: DailyData[] = Array.from(revenueByDayMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top products by revenue
    const productMap = new Map<string, { name: string; unitsSold: number; revenue: number }>();
    allOrders.forEach((order) => {
      (order.order_items || []).forEach((item: { product_id: string; product_name: string; quantity: number; price_at_time: number }) => {
        const existing = productMap.get(item.product_id) || {
          name: item.product_name,
          unitsSold: 0,
          revenue: 0,
        };
        productMap.set(item.product_id, {
          name: item.product_name,
          unitsSold: existing.unitsSold + item.quantity,
          revenue: existing.revenue + item.price_at_time * item.quantity,
        });
      });
    });

    const topProducts: TopProduct[] = Array.from(productMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Orders by status
    const statusCounts = allOrders.reduce((acc, order) => {
      const status = order.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ordersByStatus: OrderStatusData[] = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentOrders = allOrders.filter(
      (o) => new Date(o.created_at) >= sevenDaysAgo
    ).length;

    const response: AnalyticsResponse = {
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalCustomers: uniqueCustomers.size,
        repeatCustomers,
        conversionRate: 0, // Would need session data to calculate
      },
      revenueByDay,
      topProducts,
      ordersByStatus,
      recentOrders,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
