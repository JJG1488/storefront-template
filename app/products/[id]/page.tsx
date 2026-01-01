import { notFound } from "next/navigation";
import { getProduct, formatPrice } from "@/data/products";
import { getProductReviews, getProductRating } from "@/lib/reviews";
import { getStoreSettingsFromDB } from "@/lib/settings";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductTabs } from "@/components/ProductTabs";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: { id: string };
}

export async function generateStaticParams() {
  // For dynamic routes, we don't pre-generate
  return [];
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  // Fetch reviews, rating, and settings in parallel
  const [reviews, rating, settings] = await Promise.all([
    getProductReviews(params.id),
    getProductRating(params.id),
    getStoreSettingsFromDB(),
  ]);

  // Get low stock threshold from settings
  const lowStockThreshold = settings?.lowStockThreshold ?? 5;

  // Transform reviews to match ProductTabs expected format (snake_case to camelCase)
  const formattedReviews = reviews.map((review) => ({
    id: review.id,
    authorName: review.author_name,
    rating: review.rating,
    title: review.title || undefined,
    body: review.body || "",
    isVerified: review.is_verified,
    createdAt: review.created_at,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-lg"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {product.images.slice(1, 5).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.name} ${i + 2}`}
                  className="w-full aspect-square object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          {/* Digital Product Badge */}
          {product.is_digital && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
              <Download className="w-4 h-4" />
              Instant Download
            </div>
          )}

          <p className="text-2xl font-semibold text-brand mb-4">
            {formatPrice(product.price)}
          </p>
          <p className="text-gray-600 mb-8">{product.description}</p>

          {/* Only show out of stock for physical products when tracking inventory AND count is 0 */}
          {!product.is_digital && product.track_inventory && product.inventory_count === 0 ? (
            <button
              disabled
              className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            >
              Out of Stock
            </button>
          ) : (
            <AddToCartButton product={product} lowStockThreshold={lowStockThreshold} />
          )}
        </div>
      </div>

      {/* Product Tabs: Description, Reviews */}
      <div className="mt-12">
        <ProductTabs
          description={product.description || ""}
          reviews={formattedReviews}
          averageRating={rating.average}
        />
      </div>
    </div>
  );
}
