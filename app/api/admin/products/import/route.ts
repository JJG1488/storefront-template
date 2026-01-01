import { NextRequest, NextResponse } from "next/server";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";
import { canAddProduct, getProductLimit } from "@/lib/products";

// Helper function to generate URL-friendly slug from product name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

// Download image from URL and upload to Supabase Storage
async function downloadAndUploadImage(
  imageUrl: string,
  supabase: ReturnType<typeof getSupabaseAdmin>,
  storeId: string
): Promise<string | null> {
  if (!supabase) return null;

  try {
    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "GoSovereign-ImageImporter/1.0",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${imageUrl} - ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    // Validate file size (5MB max)
    if (buffer.byteLength > 5 * 1024 * 1024) {
      console.error(`Image too large: ${imageUrl}`);
      return null;
    }

    // Validate content type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.some(t => contentType.includes(t))) {
      console.error(`Invalid image type: ${contentType}`);
      return null;
    }

    // Generate a unique filename
    const extension = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
      ? "webp"
      : contentType.includes("gif")
      ? "gif"
      : "jpg";
    const filename = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(filename, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error processing image ${imageUrl}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase) {
      return NextResponse.json({
        error: "Database not configured",
        detail: "NEXT_PUBLIC_SUPABASE_URL may be missing"
      }, { status: 500 });
    }

    if (!storeId) {
      return NextResponse.json({
        error: "Store not configured",
        detail: "NEXT_PUBLIC_STORE_ID is missing"
      }, { status: 500 });
    }

    // Check product limit for Starter tier
    const { count: productCount, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId);

    if (countError) {
      console.error("Product count error:", countError);
    }

    const currentCount = productCount || 0;
    if (!canAddProduct(currentCount)) {
      const limit = getProductLimit();
      return NextResponse.json({
        error: "Product limit reached",
        detail: `You've reached your ${limit} product limit. Upgrade to Pro for unlimited products.`,
        limit,
        current: currentCount,
        upgrade: true
      }, { status: 403 });
    }

    const body = await request.json();

    // Download and upload images
    const uploadedImages: { url: string; alt: string; position: number }[] = [];

    if (body.images && Array.isArray(body.images)) {
      for (let i = 0; i < body.images.length; i++) {
        const imageUrl = body.images[i];
        if (typeof imageUrl === "string" && imageUrl.startsWith("http")) {
          const uploadedUrl = await downloadAndUploadImage(imageUrl, supabase, storeId);
          if (uploadedUrl) {
            uploadedImages.push({
              url: uploadedUrl,
              alt: body.name || "",
              position: i,
            });
          }
        }
      }
    }

    // Create the product
    const { data, error } = await supabase
      .from("products")
      .insert({
        store_id: storeId,
        name: body.name,
        slug: generateSlug(body.name),
        description: body.description || "",
        price: body.price || 0, // Already in cents from CSV parser
        images: uploadedImages,
        status: "active",
        inventory_count: body.inventory_count ?? null,
        track_inventory: body.track_inventory ?? false,
        is_digital: body.is_digital ?? false,
        has_variants: false,
        variant_options: [],
      })
      .select()
      .single();

    if (error) {
      console.error("Product create error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        storeId: storeId,
      });
      return NextResponse.json({
        error: "Failed to create product",
        detail: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product: data,
      imagesUploaded: uploadedImages.length,
      imagesRequested: body.images?.length || 0,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
