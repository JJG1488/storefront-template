import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Helper to get customer from token
async function getCustomerFromToken(
  token: string,
  supabase: ReturnType<typeof getSupabaseAdmin>,
  storeId: string
) {
  if (!supabase) return null;

  const { data: sessions } = await supabase
    .from("customer_sessions")
    .select(
      `
      id,
      expires_at,
      customer:customers (
        id,
        email,
        store_id
      )
    `
    )
    .eq("token", token)
    .limit(1);

  if (!sessions || sessions.length === 0) return null;

  const session = sessions[0];
  // customer is returned as array from join, get first element
  const customerData = session.customer as unknown as Array<{
    id: string;
    email: string;
    store_id: string;
  }>;
  const customer = Array.isArray(customerData) ? customerData[0] : customerData;

  if (customer.store_id !== storeId) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  return customer;
}

// GET - Get single address
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: addressId } = await params;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const customer = await getCustomerFromToken(token, supabase, storeId);
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: address, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("id", addressId)
      .eq("customer_id", customer.id)
      .single();

    if (error || !address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Address fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch address" },
      { status: 500 }
    );
  }
}

// PUT - Update address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: addressId } = await params;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const customer = await getCustomerFromToken(token, supabase, storeId);
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify address belongs to customer
    const { data: existing } = await supabase
      .from("customer_addresses")
      .select("id")
      .eq("id", addressId)
      .eq("customer_id", customer.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      label,
      firstName,
      lastName,
      company,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefaultShipping,
      isDefaultBilling,
    } = body;

    // If setting as default, unset other defaults first
    if (isDefaultShipping) {
      await supabase
        .from("customer_addresses")
        .update({ is_default_shipping: false })
        .eq("customer_id", customer.id)
        .neq("id", addressId);
    }

    if (isDefaultBilling) {
      await supabase
        .from("customer_addresses")
        .update({ is_default_billing: false })
        .eq("customer_id", customer.id)
        .neq("id", addressId);
    }

    const { data: address, error } = await supabase
      .from("customer_addresses")
      .update({
        label: label ?? null,
        first_name: firstName,
        last_name: lastName,
        company: company ?? null,
        address_line1: addressLine1,
        address_line2: addressLine2 ?? null,
        city,
        state: state ?? null,
        postal_code: postalCode,
        country,
        phone: phone ?? null,
        is_default_shipping: isDefaultShipping ?? false,
        is_default_billing: isDefaultBilling ?? false,
      })
      .eq("id", addressId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update address:", error);
      return NextResponse.json(
        { error: "Failed to update address" },
        { status: 500 }
      );
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Address update error:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

// DELETE - Delete address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: addressId } = await params;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const customer = await getCustomerFromToken(token, supabase, storeId);
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", addressId)
      .eq("customer_id", customer.id);

    if (error) {
      console.error("Failed to delete address:", error);
      return NextResponse.json(
        { error: "Failed to delete address" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Address delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
