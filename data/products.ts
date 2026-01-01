import { getSupabase, getSupabaseAdmin, getStoreId, isBuildTime } from "@/lib/supabase";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  images: string[];
  track_inventory: boolean;
  inventory_count: number | null;
  // Digital product fields
  is_digital: boolean;
  digital_file_url: string | null;
  // Variant fields
  has_variants: boolean;
}

// Fetch products from Supabase
export async function getProducts(): Promise<Product[]> {
  // Return empty array during build time
  if (isBuildTime()) {
    return [];
  }

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      console.warn("No store ID or Supabase configured");
      return [];
    }

    // Check if we should hide out of stock products
    let hideOutOfStock = false;
    const { data: settingsData } = await supabase
      .from("store_settings")
      .select("settings")
      .eq("store_id", storeId)
      .limit(1);

    if (settingsData?.[0]?.settings?.hideOutOfStock) {
      hideOutOfStock = true;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    // Transform database products to Product interface
    let products = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: Math.round(p.price * 100), // Convert dollars to cents
      // Handle both string URLs and {url, alt, position} objects
      images: (p.images || []).map((img: unknown) =>
        typeof img === "string" ? img : (img as { url: string }).url
      ),
      track_inventory: p.track_inventory ?? false,
      inventory_count: p.inventory_count,
      is_digital: p.is_digital ?? false,
      digital_file_url: p.digital_file_url || null,
      has_variants: p.has_variants ?? false,
    }));

    // Filter out out-of-stock products if setting is enabled
    if (hideOutOfStock) {
      products = products.filter((p) => {
        // Digital products are never out of stock
        if (p.is_digital) return true;
        // Products not tracking inventory are always shown
        if (!p.track_inventory) return true;
        // Show products with stock > 0
        return (p.inventory_count ?? 0) > 0;
      });
    }

    return products;
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  // Return null during build time
  if (isBuildTime()) {
    return null;
  }

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      return null;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || "",
      price: Math.round(data.price * 100), // Convert dollars to cents
      // Handle both string URLs and {url, alt, position} objects
      images: (data.images || []).map((img: unknown) =>
        typeof img === "string" ? img : (img as { url: string }).url
      ),
      track_inventory: data.track_inventory ?? false,
      inventory_count: data.inventory_count,
      is_digital: data.is_digital ?? false,
      digital_file_url: data.digital_file_url || null,
      has_variants: data.has_variants ?? false,
    };
  } catch (err) {
    console.error("Failed to fetch product:", err);
    return null;
  }
}

// Server-side version using admin client (bypasses RLS, for API routes)
export async function getProductAdmin(id: string): Promise<Product | null> {
  if (isBuildTime()) {
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      console.error("[getProductAdmin] Missing supabase client or storeId", {
        hasSupabase: !!supabase,
        storeId
      });
      return null;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (error) {
      console.error("[getProductAdmin] Supabase error:", error);
      return null;
    }

    if (!data) {
      console.error("[getProductAdmin] No data returned for product:", id);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || "",
      price: Math.round(data.price * 100), // Convert dollars to cents
      images: (data.images || []).map((img: unknown) =>
        typeof img === "string" ? img : (img as { url: string }).url
      ),
      track_inventory: data.track_inventory ?? false,
      inventory_count: data.inventory_count,
      is_digital: data.is_digital ?? false,
      digital_file_url: data.digital_file_url || null,
      has_variants: data.has_variants ?? false,
    };
  } catch (err) {
    console.error("[getProductAdmin] Failed to fetch product:", err);
    return null;
  }
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
