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
    const orderStoreId = (orderItem.orders as unknown as { store_id: string })?.store_id;
    if (orderStoreId !== storeId) {
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
    if (product.download_limit !== null && orderItem.download_count >= product.download_limit) {
      return NextResponse.json(
        { error: `Download limit reached (${product.download_limit} downloads)` },
        { status: 403 }
      );
    }

    // Increment download count
    await supabase
      .from("order_items")
      .update({ download_count: orderItem.download_count + 1 })
      .eq("id", orderItem.id);

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

    console.log(`Download initiated for product "${product.name}" (download ${orderItem.download_count + 1})`);

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
