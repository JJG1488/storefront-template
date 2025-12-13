import { getSupabase, getStoreId, isBuildTime } from "@/lib/supabase";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  images: string[];
  inventory_count?: number;
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
    return (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: Math.round(p.price * 100), // Convert dollars to cents
      // Handle both string URLs and {url, alt, position} objects
      images: (p.images || []).map((img: unknown) =>
        typeof img === "string" ? img : (img as { url: string }).url
      ),
      inventory_count: p.inventory_count,
    }));
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
      inventory_count: data.inventory_count,
    };
  } catch (err) {
    console.error("Failed to fetch product:", err);
    return null;
  }
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
