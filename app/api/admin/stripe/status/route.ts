import { NextRequest, NextResponse } from "next/server";
import { createFreshAdminClient, getStoreId, isBuildTime } from "@/lib/supabase";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";

// Prevent caching
export const dynamic = "force-dynamic";

/**
 * GET - Fetch Stripe connection status
 * Returns whether Stripe is connected, the account ID, and a reconnect URL
 */
export async function GET(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json({
      connected: false,
      accountId: null,
      reconnectUrl: null,
    });
  }

  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createFreshAdminClient();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      // Fall back to environment variable
      const stripeAccountId = process.env.STRIPE_ACCOUNT_ID;
      return NextResponse.json({
        connected: !!stripeAccountId,
        accountId: stripeAccountId || null,
        reconnectUrl: null,
      });
    }

    // Get store details including Stripe account
    const { data: store, error } = await supabase
      .from("stores")
      .select("stripe_account_id, subdomain")
      .eq("id", storeId)
      .single();

    if (error) {
      console.error("Failed to fetch store:", error);
      // Fall back to environment variable
      const stripeAccountId = process.env.STRIPE_ACCOUNT_ID;
      return NextResponse.json({
        connected: !!stripeAccountId,
        accountId: stripeAccountId || null,
        reconnectUrl: null,
      });
    }

    const connected = !!store?.stripe_account_id;
    const accountId = store?.stripe_account_id || null;

    // Build reconnect URL that goes through the platform
    // The platform handles OAuth and updates the store
    const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || "https://gosovereign.io";

    // Build return URL to redirect back to this store's settings after OAuth
    const storeUrl = process.env.NEXT_PUBLIC_STORE_URL ||
      (store?.subdomain ? `https://${store.subdomain}.gosovereign.io` : null);
    const returnUrl = storeUrl ? `${storeUrl}/admin/settings?tab=payments` : null;

    // Include return URL in connect request so callback redirects back here
    const reconnectUrl = returnUrl
      ? `${platformUrl}/api/stripe/connect?store=${storeId}&return=${encodeURIComponent(returnUrl)}`
      : `${platformUrl}/api/stripe/connect?store=${storeId}`;

    return NextResponse.json({
      connected,
      accountId,
      reconnectUrl,
    });
  } catch (err) {
    console.error("Failed to check Stripe status:", err);
    return NextResponse.json(
      { error: "Failed to check Stripe status" },
      { status: 500 }
    );
  }
}
