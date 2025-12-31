import { NextRequest, NextResponse } from "next/server";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

// Tiered file size limits (in bytes)
const FILE_SIZE_LIMITS: Record<string, number> = {
  starter: 100 * 1024 * 1024,  // 100MB
  pro: 250 * 1024 * 1024,      // 250MB
  hosted: 500 * 1024 * 1024,   // 500MB
};

// Allowed file types for digital products
const ALLOWED_TYPES = [
  // Documents
  "application/pdf",
  "application/epub+zip",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  // Audio
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/flac",
  "audio/aac",
  // Video
  "video/mp4",
  "video/webm",
  "video/quicktime",
  // Images (for digital art, templates)
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  // Other
  "application/json",
  "text/plain",
  "text/csv",
];

// Friendly file type names for error messages
const ALLOWED_EXTENSIONS = "PDF, EPUB, ZIP, RAR, MP3, WAV, FLAC, MP4, WebM, PNG, JPG, SVG, JSON, TXT, CSV";

export async function POST(request: NextRequest) {
  // Verify admin auth
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get tier for size limit
    const tier = process.env.NEXT_PUBLIC_PAYMENT_TIER || "starter";
    const maxSize = FILE_SIZE_LIMITS[tier] || FILE_SIZE_LIMITS.starter;
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS}` },
        { status: 400 }
      );
    }

    // Validate file size based on tier
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size for your plan is ${maxSizeMB}MB.` },
        { status: 400 }
      );
    }

    // Generate unique filename with original extension
    const ext = file.name.split(".").pop() || "file";
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, "-") // Sanitize
      .slice(0, 50); // Limit length
    const filename = `${storeId}/${Date.now()}-${sanitizedName}.${ext}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage (product-files bucket - PRIVATE)
    const { data, error } = await supabase.storage
      .from("product-files")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("File upload error:", error);
      if (error.message?.includes("Bucket not found")) {
        return NextResponse.json(
          { error: "Digital file storage not configured. Please contact support." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Return the file path (not a public URL - downloads go through our endpoint)
    // Store this path in product.digital_file_url
    return NextResponse.json({
      path: filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
