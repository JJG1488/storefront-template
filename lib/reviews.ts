import { getSupabase, getSupabaseAdmin, getStoreId, isBuildTime } from "./supabase";

export interface Review {
  id: string;
  store_id: string;
  product_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_featured: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface CreateReviewData {
  product_id?: string | null;
  author_name: string;
  rating: number;
  title?: string;
  body?: string;
  is_featured?: boolean;
  is_verified?: boolean;
}

export interface UpdateReviewData {
  author_name?: string;
  rating?: number;
  title?: string;
  body?: string;
  is_featured?: boolean;
  is_verified?: boolean;
}

// Fetch all reviews for a store
export async function getReviews(): Promise<Review[]> {
  if (isBuildTime()) return [];

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) return [];

    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch reviews:", err);
    return [];
  }
}

// Fetch reviews for a specific product
export async function getProductReviews(productId: string): Promise<Review[]> {
  if (isBuildTime()) return [];

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) return [];

    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("store_id", storeId)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching product reviews:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch product reviews:", err);
    return [];
  }
}

// Fetch featured reviews (for homepage testimonials)
export async function getFeaturedReviews(): Promise<Review[]> {
  if (isBuildTime()) return [];

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) return [];

    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("store_id", storeId)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Error fetching featured reviews:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch featured reviews:", err);
    return [];
  }
}

// Calculate average rating for a product
export async function getProductRating(productId: string): Promise<{ average: number; count: number }> {
  if (isBuildTime()) return { average: 0, count: 0 };

  try {
    const supabase = getSupabase();
    const storeId = getStoreId();

    if (!supabase || !storeId) return { average: 0, count: 0 };

    const { data, error } = await supabase
      .from("product_reviews")
      .select("rating")
      .eq("store_id", storeId)
      .eq("product_id", productId);

    if (error || !data || data.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = data.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: sum / data.length,
      count: data.length,
    };
  } catch (err) {
    console.error("Failed to calculate product rating:", err);
    return { average: 0, count: 0 };
  }
}

// Admin functions (using service role key)

export async function createReview(data: CreateReviewData): Promise<Review | null> {
  if (isBuildTime()) return null;

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) return null;

    const { data: review, error } = await supabase
      .from("product_reviews")
      .insert({
        store_id: storeId,
        product_id: data.product_id || null,
        author_name: data.author_name,
        rating: data.rating,
        title: data.title || null,
        body: data.body || null,
        is_featured: data.is_featured || false,
        is_verified: data.is_verified || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating review:", error);
      return null;
    }

    return review;
  } catch (err) {
    console.error("Failed to create review:", err);
    return null;
  }
}

export async function updateReview(id: string, data: UpdateReviewData): Promise<Review | null> {
  if (isBuildTime()) return null;

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) return null;

    const { data: review, error } = await supabase
      .from("product_reviews")
      .update(data)
      .eq("id", id)
      .eq("store_id", storeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating review:", error);
      return null;
    }

    return review;
  } catch (err) {
    console.error("Failed to update review:", err);
    return null;
  }
}

export async function deleteReview(id: string): Promise<boolean> {
  if (isBuildTime()) return false;

  try {
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) return false;

    const { error } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", id)
      .eq("store_id", storeId);

    if (error) {
      console.error("Error deleting review:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to delete review:", err);
    return false;
  }
}
