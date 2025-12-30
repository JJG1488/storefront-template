"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductLimitPrompt } from "@/components/UpgradePrompt";

interface Product {
  id: string;
  name: string;
  price: number;
  inventory_count: number | null;
  status: string;
  images: { url: string }[];
}

interface TierInfo {
  name: string;
  maxProducts: number | null;
  isUnlimited: boolean;
  current: number;
  canAdd: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get("filter");

  useEffect(() => {
    async function loadProducts() {
      try {
        const token = localStorage.getItem("admin_token");
        const url = filter === "low-stock"
          ? "/api/admin/products?filter=low-stock"
          : "/api/admin/products";

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Handle both old format (array) and new format (object with products + tier)
          if (Array.isArray(data)) {
            setProducts(data);
          } else {
            setProducts(data.products || []);
            setTierInfo(data.tier || null);
          }
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [filter]);

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  const limitReached = tierInfo && !tierInfo.isUnlimited && !tierInfo.canAdd;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            Products {filter === "low-stock" && "(Low Stock)"}
          </h1>
          {/* Product count indicator for limited tiers */}
          {tierInfo && !tierInfo.isUnlimited && (
            <span className={`text-sm px-3 py-1 rounded-full ${
              limitReached
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {tierInfo.current} / {tierInfo.maxProducts} products
            </span>
          )}
        </div>
        {limitReached ? (
          <span className="text-sm text-amber-600 font-medium">
            Limit reached - Upgrade to add more
          </span>
        ) : (
          <Link
            href="/admin/products/new"
            className="bg-brand text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            Add Product
          </Link>
        )}
      </div>

      {/* Show upgrade prompt when limit is reached */}
      {limitReached && (
        <div className="mb-6">
          <ProductLimitPrompt />
        </div>
      )}

      {filter && (
        <div className="mb-4">
          <Link href="/admin/products" className="text-brand hover:underline">
            &larr; View all products
          </Link>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">
            {filter === "low-stock"
              ? "No low stock products"
              : "No products yet"}
          </p>
          {!filter && (
            <Link href="/admin/products/new" className="text-brand hover:underline">
              Add your first product
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Inventory
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => router.push(`/admin/products/${product.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded" />
                      )}
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        product.inventory_count !== null &&
                        product.inventory_count <= 5
                          ? "text-orange-600 font-medium"
                          : ""
                      }
                    >
                      {product.inventory_count ?? "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        product.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-brand hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
