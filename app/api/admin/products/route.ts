import { NextRequest, NextResponse } from "next/server";
import { activeTokens } from "@/lib/admin-tokens";
import { getSupabase, getStoreId } from "@/lib/supabase";

// Helper to verify auth
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return token ? activeTokens.has(token) : false;
}

// GET - List products
export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    const filter = request.nextUrl.searchParams.get("filter");

    let query = supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    // Filter for low stock
    if (filter === "low-stock") {
      query = query.lte("inventory_count", 5);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Products fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Products error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create product
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Store not configured" }, { status: 500 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("products")
      .insert({
        store_id: storeId,
        name: body.name,
        description: body.description || "",
        price: body.price || 0,
        images: body.images || [],
        status: body.status || "active",
        inventory_count: body.inventory_count ?? null,
        track_inventory: body.track_inventory ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error("Product create error:", error);
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Create error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
