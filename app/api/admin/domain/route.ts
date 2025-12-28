import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId, isBuildTime } from "@/lib/supabase";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";

export const dynamic = "force-dynamic";

interface DomainStatus {
  subdomain: string;
  subdomainUrl: string;
  customDomain: string | null;
  status: "none" | "pending" | "configured" | "error";
  message?: string;
}

// GET - Fetch current domain configuration
export async function GET(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json({ domain: null });
  }

  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { data: store, error } = await supabase
      .from("stores")
      .select("subdomain, custom_domain, deployment_url")
      .eq("id", storeId)
      .single();

    if (error || !store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Determine status based on custom_domain field
    let status: DomainStatus["status"] = "none";
    let message: string | undefined;

    if (store.custom_domain) {
      // For now, mark as "pending" since we need manual verification
      // In the future, this could check DNS or Vercel API
      status = "pending";
      message = "Domain saved. Configure your DNS records and contact support to complete setup.";
    }

    const response: DomainStatus = {
      subdomain: store.subdomain || "",
      subdomainUrl: store.deployment_url || `https://${store.subdomain}.gosovereign.io`,
      customDomain: store.custom_domain,
      status,
      message,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch domain:", error);
    return NextResponse.json(
      { error: "Failed to fetch domain configuration" },
      { status: 500 }
    );
  }
}

// POST - Save custom domain
export async function POST(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json({ error: "Not available during build" }, { status: 400 });
  }

  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { customDomain } = body;

    // Validate domain format
    if (customDomain) {
      const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(customDomain)) {
        return NextResponse.json(
          { error: "Invalid domain format. Use format: example.com or shop.example.com" },
          { status: 400 }
        );
      }
    }

    // Update the store's custom_domain
    const { error } = await supabase
      .from("stores")
      .update({
        custom_domain: customDomain || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (error) {
      console.error("Failed to save domain:", error);

      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This domain is already in use by another store" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to save domain" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: customDomain
        ? "Domain saved. Configure your DNS records and contact support to complete setup."
        : "Custom domain removed.",
    });
  } catch (error) {
    console.error("Failed to save domain:", error);
    return NextResponse.json(
      { error: "Failed to save domain" },
      { status: 500 }
    );
  }
}

// DELETE - Remove custom domain
export async function DELETE(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json({ error: "Not available during build" }, { status: 400 });
  }

  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from("stores")
      .update({
        custom_domain: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (error) {
      console.error("Failed to remove domain:", error);
      return NextResponse.json(
        { error: "Failed to remove domain" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Custom domain removed.",
    });
  } catch (error) {
    console.error("Failed to remove domain:", error);
    return NextResponse.json(
      { error: "Failed to remove domain" },
      { status: 500 }
    );
  }
}
