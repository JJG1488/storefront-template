import { ProductGrid } from "@/components/ProductGrid";
import { getProducts } from "@/data/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">All Products</h1>
      <ProductGrid products={products} />
    </div>
  );
}
