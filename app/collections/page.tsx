"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  product_count: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setError(null);
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      } else {
        setError("Failed to load collections. Please try again.");
      }
    } catch (err) {
      console.error("Failed to fetch collections:", err);
      setError("Failed to load collections. Please check your connection.");
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

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchCollections();
            }}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Collections</h1>

      {collections.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No collections available</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-brand hover:underline"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {collection.image_url ? (
                  <img
                    src={collection.image_url}
                    alt={collection.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderOpen className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
                  {collection.name}
                </h2>
                {collection.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {collection.description}
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  {collection.product_count} {collection.product_count === 1 ? "product" : "products"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
