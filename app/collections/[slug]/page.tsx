"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  track_inventory: boolean;
  inventory_count: number | null;
  is_digital: boolean;
  digital_file_url: string | null;
  has_variants: boolean;
}

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, [slug]);

  const fetchCollection = async () => {
    try {
      const res = await fetch(`/api/collections/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setCollection(data.collection);
        setProducts(data.products || []);
      } else if (res.status === 404) {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Failed to fetch collection:", err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      </div>
    );
  }

  if (notFound || !collection) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Collection Not Found</h1>
          <p className="text-gray-500 mb-6">The collection you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-brand hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            View all collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          All Collections
        </Link>
      </nav>

      {/* Collection Header */}
      <div className="mb-8">
        {collection.image_url && (
          <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden mb-6">
            <img
              src={collection.image_url}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
        {collection.description && (
          <p className="text-gray-600 mt-2 max-w-2xl">{collection.description}</p>
        )}
        <p className="text-gray-400 mt-2">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No products in this collection yet</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-brand hover:underline"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
