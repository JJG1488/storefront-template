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
        first_name,
        last_name,
        phone,
        accepts_marketing,
        store_id,
        created_at
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
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    accepts_marketing: boolean;
    store_id: string;
    created_at: string;
  }>;
  const customer = Array.isArray(customerData) ? customerData[0] : customerData;

  if (customer.store_id !== storeId) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  return customer;
}

// GET - Get profile
export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({
      profile: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        acceptsMarketing: customer.accepts_marketing,
        createdAt: customer.created_at,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update profile
export async function PUT(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { firstName, lastName, phone, acceptsMarketing } = body;

    const { data: updated, error } = await supabase
      .from("customers")
      .update({
        first_name: firstName ?? customer.first_name,
        last_name: lastName ?? customer.last_name,
        phone: phone ?? customer.phone,
        accepts_marketing: acceptsMarketing ?? customer.accepts_marketing,
      })
      .eq("id", customer.id)
      .select("id, email, first_name, last_name, phone, accepts_marketing")
      .single();

    if (error) {
      console.error("Failed to update profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: {
        id: updated.id,
        email: updated.email,
        firstName: updated.first_name,
        lastName: updated.last_name,
        phone: updated.phone,
        acceptsMarketing: updated.accepts_marketing,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
