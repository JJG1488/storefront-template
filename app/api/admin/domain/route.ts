import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId, isBuildTime } from "@/lib/supabase";
import { verifyAuthFromRequest, getAdminPassword } from "@/lib/admin-tokens";

export const dynamic = "force-dynamic";

interface DomainVerification {
  type: string;
  domain: string;
  value: string;
  reason: string;
}

interface DomainStatus {
  subdomain: string;
  subdomainUrl: string;
  customDomain: string | null;
  status: "none" | "pending" | "verifying" | "configured" | "error";
  verified: boolean;
  verification: DomainVerification[];
  message?: string;
}

const PLATFORM_API_URL = process.env.PLATFORM_API_URL || "https://gosovereign.io";

async function callPlatformAPI(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const storeId = getStoreId();
  const adminPassword = getAdminPassword();

  if (!storeId || !adminPassword) {
    throw new Error("Store not configured");
  }

  const url = `${PLATFORM_API_URL}/api/stores/${storeId}/domain${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${adminPassword}`,
      "Content-Type": "application/json",
    },
  });
}

// GET - Fetch current domain configuration and verification status
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
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Build base response
    const response: DomainStatus = {
      subdomain: store.subdomain || "",
      subdomainUrl:
        store.deployment_url || `https://${store.subdomain}.gosovereign.io`,
      customDomain: store.custom_domain,
      status: "none",
      verified: false,
      verification: [],
    };

    // If custom domain is set, check verification status via platform API
    if (store.custom_domain) {
      try {
        const platformResponse = await callPlatformAPI(
          `?domain=${encodeURIComponent(store.custom_domain)}`
        );

        if (platformResponse.ok) {
          const data = await platformResponse.json();

          response.verified = data.verified || false;
          response.verification = data.verification || [];

          if (data.verified) {
            response.status = "configured";
            response.message = "Domain is configured and SSL is active.";
          } else if (data.verification && data.verification.length > 0) {
            response.status = "verifying";
            response.message =
              "Domain added to Vercel. Configure your DNS records below.";
          } else {
            response.status = "pending";
            response.message =
              "Domain saved. Click 'Add to Vercel' to configure.";
          }
        } else {
          // Platform API error - domain may not be added to Vercel yet
          response.status = "pending";
          response.message =
            "Domain saved. Click 'Add to Vercel' to configure.";
        }
      } catch (err) {
        // Platform unreachable - show pending status
        console.error("Platform API error:", err);
        response.status = "pending";
        response.message =
          "Domain saved. Configure your DNS records and contact support.";
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch domain:", error);
    return NextResponse.json(
      { error: "Failed to fetch domain configuration" },
      { status: 500 }
    );
  }
}

// POST - Save custom domain and add to Vercel
export async function POST(request: NextRequest) {
  if (isBuildTime()) {
    return NextResponse.json(
      { error: "Not available during build" },
      { status: 400 }
    );
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
    const { customDomain, addToVercel } = body;

    // Validate domain format
    if (customDomain) {
      const domainRegex =
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(customDomain)) {
        return NextResponse.json(
          {
            error:
              "Invalid domain format. Use format: example.com or shop.example.com",
          },
          { status: 400 }
        );
      }
    }

    // Save to local database first
    const { error } = await supabase
      .from("stores")
      .update({
        custom_domain: customDomain || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (error) {
      console.error("Failed to save domain:", error);

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

    // If addToVercel flag is set, call platform API to add domain
    if (customDomain && addToVercel) {
      try {
        const platformResponse = await callPlatformAPI("", {
          method: "POST",
          body: JSON.stringify({ domain: customDomain }),
        });

        const data = await platformResponse.json();

        if (!platformResponse.ok) {
          return NextResponse.json({
            success: true,
            message: data.error || "Domain saved but failed to add to Vercel.",
            verification: [],
            verified: false,
          });
        }

        return NextResponse.json({
          success: true,
          message: data.verified
            ? "Domain configured and SSL is active!"
            : "Domain added to Vercel. Configure your DNS records to complete setup.",
          verification: data.verification || [],
          verified: data.verified || false,
        });
      } catch (err) {
        console.error("Platform API error:", err);
        return NextResponse.json({
          success: true,
          message:
            "Domain saved. Contact support to complete Vercel configuration.",
          verification: [],
          verified: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: customDomain
        ? "Domain saved. Click 'Add to Vercel' to configure."
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
    return NextResponse.json(
      { error: "Not available during build" },
      { status: 400 }
    );
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

    // Get current domain before deleting
    const { data: store } = await supabase
      .from("stores")
      .select("custom_domain")
      .eq("id", storeId)
      .single();

    // Remove from Vercel first
    if (store?.custom_domain) {
      try {
        await callPlatformAPI(
          `?domain=${encodeURIComponent(store.custom_domain)}`,
          { method: "DELETE" }
        );
      } catch (err) {
        console.error("Failed to remove domain from Vercel:", err);
        // Continue with local deletion anyway
      }
    }

    // Clear from database
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
