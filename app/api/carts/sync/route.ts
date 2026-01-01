import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";
import { getStoreConfig } from "@/lib/store";

export const dynamic = "force-dynamic";

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
  };
  quantity: number;
  variant?: {
    id: string;
    name: string;
    options: Record<string, string>;
    price_adjustment: number;
  };
}

interface CustomerData {
  id: string;
  email: string;
  store_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // Verify customer authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Verify token and get customer
    const { data: sessions, error: sessionError } = await supabase
      .from("customer_sessions")
      .select(`
        id,
        expires_at,
        customer:customers (
          id,
          email,
          store_id
        )
      `)
      .eq("token", token)
      .limit(1);

    if (sessionError || !sessions || sessions.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = sessions[0];
    const customerData = session.customer as unknown as CustomerData[] | CustomerData;
    const customer = Array.isArray(customerData) ? customerData[0] : customerData;

    // Verify session belongs to current store and hasn't expired
    if (customer.store_id !== storeId || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body as { items: CartItem[] };

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid cart items" }, { status: 400 });
    }

    const store = getStoreConfig();

    // Calculate cart total (in cents)
    const cartTotal = items.reduce((sum, item) => {
      const priceAdjustment = item.variant?.price_adjustment || 0;
      const itemPrice = item.product.price + priceAdjustment;
      return sum + itemPrice * item.quantity;
    }, 0);

    // Check for existing active cart for this customer
    const { data: existingCart } = await supabase
      .from("abandoned_carts")
      .select("id, recovery_token")
      .eq("store_id", storeId)
      .eq("customer_id", customer.id)
      .is("recovered_at", null)
      .is("order_id", null)
      .single();

    if (items.length === 0) {
      // If cart is empty, delete any existing abandoned cart record
      if (existingCart) {
        await supabase
          .from("abandoned_carts")
          .delete()
          .eq("id", existingCart.id);
      }
      return NextResponse.json({ success: true, message: "Cart cleared" });
    }

    // Prepare cart items for storage (minimal data needed for recovery)
    const cartItemsJson = items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      product_price: item.product.price,
      product_image: item.product.images?.[0] || null,
      quantity: item.quantity,
      variant: item.variant
        ? {
            id: item.variant.id,
            name: item.variant.name,
            options: item.variant.options,
            price_adjustment: item.variant.price_adjustment,
          }
        : null,
    }));

    if (existingCart) {
      // Update existing cart
      await supabase
        .from("abandoned_carts")
        .update({
          cart_items: cartItemsJson,
          cart_total: cartTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCart.id);

      return NextResponse.json({ success: true, message: "Cart updated" });
    } else {
      // Create new abandoned cart with recovery token
      const recoveryToken = generateRecoveryToken();

      await supabase.from("abandoned_carts").insert({
        store_id: storeId,
        customer_id: customer.id,
        cart_items: cartItemsJson,
        cart_total: cartTotal,
        recovery_token: recoveryToken,
      });

      return NextResponse.json({ success: true, message: "Cart synced" });
    }
  } catch (error) {
    console.error("Cart sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync cart" },
      { status: 500 }
    );
  }
}

function generateRecoveryToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
