import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const verifyRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/admin/verify`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!verifyRes.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const minAge = searchParams.get("minAge") || "1"; // Default: 1 hour
    const includeEmailed = searchParams.get("includeEmailed") === "true";

    // Calculate cutoff time based on minimum age
    const hoursAgo = parseInt(minAge, 10);
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    // Build query for abandoned carts
    let query = supabase
      .from("abandoned_carts")
      .select(`
        id,
        cart_items,
        cart_total,
        recovery_email_sent_at,
        created_at,
        updated_at,
        customers (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq("store_id", storeId)
      .is("recovered_at", null)
      .is("order_id", null)
      .lt("updated_at", cutoffTime)
      .order("updated_at", { ascending: false });

    // Filter out carts that have already been emailed (unless includeEmailed)
    if (!includeEmailed) {
      query = query.is("recovery_email_sent_at", null);
    }

    const { data: carts, error } = await query;

    if (error) {
      console.error("Error fetching abandoned carts:", error);
      return NextResponse.json(
        { error: "Failed to fetch abandoned carts" },
        { status: 500 }
      );
    }

    // Transform data for frontend
    type CustomerRow = { id: string; email: string; first_name: string | null; last_name: string | null };
    const transformedCarts = (carts || []).map((cart) => {
      const customersData = cart.customers as unknown as CustomerRow[] | CustomerRow | null;
      const customerData = Array.isArray(customersData) ? customersData[0] : customersData;
      return {
        id: cart.id,
        customer: customerData ? {
          id: customerData.id,
          email: customerData.email,
          name: customerData.first_name
            ? `${customerData.first_name}${customerData.last_name ? ` ${customerData.last_name}` : ""}`
            : null,
        } : null,
      items: cart.cart_items as Array<{
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
      }>,
        total: cart.cart_total,
        emailSentAt: cart.recovery_email_sent_at,
        abandonedAt: cart.updated_at,
        createdAt: cart.created_at,
      };
    });

    return NextResponse.json({ carts: transformedCarts });
  } catch (error) {
    console.error("Abandoned carts API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch abandoned carts" },
      { status: 500 }
    );
  }
}
