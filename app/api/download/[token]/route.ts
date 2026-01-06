import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json(
        { error: "Store not configured" },
        { status: 500 }
      );
    }

    // Find the order item with this download token
    const { data: orderItem, error: orderError } = await supabase
      .from("order_items")
      .select(`
        id,
        product_id,
        download_count,
        order_id,
        orders!inner (
          store_id
        )
      `)
      .eq("download_url", token)
      .single();

    if (orderError || !orderItem) {
      console.error("Download token not found:", token);
      return NextResponse.json(
        { error: "Invalid or expired download link" },
        { status: 404 }
      );
    }

    // Verify this is for our store
    // Supabase joins can return object or array depending on relation type
    const ordersData = orderItem.orders;
    let orderStoreId: string | undefined;
    if (ordersData && typeof ordersData === "object") {
      if (Array.isArray(ordersData)) {
        orderStoreId = (ordersData[0] as { store_id?: string })?.store_id;
      } else {
        orderStoreId = (ordersData as { store_id?: string }).store_id;
      }
    }
    if (!orderStoreId || orderStoreId !== storeId) {
      return NextResponse.json(
        { error: "Invalid download link" },
        { status: 404 }
      );
    }

    // Get the product to check download limit and get file URL
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("digital_file_url, download_limit, name")
      .eq("id", orderItem.product_id)
      .single();

    if (productError || !product || !product.digital_file_url) {
      console.error("Product not found or no digital file:", orderItem.product_id);
      return NextResponse.json(
        { error: "Digital file not available" },
        { status: 404 }
      );
    }

    // Check download limit (if set)
    const currentCount = orderItem.download_count || 0;
    if (product.download_limit !== null && currentCount >= product.download_limit) {
      return NextResponse.json(
        { error: `Download limit reached (${product.download_limit} downloads)` },
        { status: 403 }
      );
    }

    // Atomically increment download count with optimistic locking
    // This prevents race conditions where concurrent requests exceed the limit
    const { data: updated, error: updateError } = await supabase
      .from("order_items")
      .update({ download_count: currentCount + 1 })
      .eq("id", orderItem.id)
      .eq("download_count", currentCount) // Optimistic lock
      .select("id")
      .single();

    if (updateError || !updated) {
      // Race condition detected - count was modified by another request
      // Re-check the limit before returning error
      const { data: recheckItem } = await supabase
        .from("order_items")
        .select("download_count")
        .eq("id", orderItem.id)
        .single();

      if (recheckItem && product.download_limit !== null &&
          recheckItem.download_count >= product.download_limit) {
        return NextResponse.json(
          { error: `Download limit reached (${product.download_limit} downloads)` },
          { status: 403 }
        );
      }

      // Limit not reached but race occurred - ask user to retry
      return NextResponse.json(
        { error: "Please try again" },
        { status: 409 }
      );
    }

    // Generate a signed URL for the file (expires in 1 hour)
    const { data: signedUrl, error: signedError } = await supabase.storage
      .from("product-files")
      .createSignedUrl(product.digital_file_url, 3600); // 1 hour expiry

    if (signedError || !signedUrl) {
      console.error("Failed to generate signed URL:", signedError);
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 }
      );
    }

    console.log(`Download initiated for product "${product.name}" (download ${currentCount + 1})`);

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl.signedUrl);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
