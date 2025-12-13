"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface ProductImage {
  url: string;
  alt?: string;
  position?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: ProductImage[];
  status: string;
  inventory_count: number | null;
  track_inventory: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("active");
  const [trackInventory, setTrackInventory] = useState(false);
  const [inventoryCount, setInventoryCount] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`/api/admin/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load product");
        }

        const product: Product = await res.json();
        setName(product.name);
        setDescription(product.description || "");
        setPrice(product.price.toString());
        setStatus(product.status);
        setTrackInventory(product.track_inventory || false);
        setInventoryCount(product.inventory_count?.toString() || "");
        setImageUrl(product.images?.[0]?.url || "");
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price) || 0,
          status,
          track_inventory: trackInventory,
          inventory_count: trackInventory ? parseInt(inventoryCount) || 0 : null,
          images: imageUrl ? [{ url: imageUrl, alt: name, position: 0 }] : [],
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save product");
      }

      router.push("/admin/products");
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to delete product");
      }

      router.push("/admin/products");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading product...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <Link
          href="/admin/products"
          className="text-gray-600 hover:text-gray-900"
        >
          &larr; Back to Products
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="mt-2 w-32 h-32 object-cover rounded"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="border-t pt-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="font-medium">Track Inventory</span>
            </label>

            {trackInventory && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inventory Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={inventoryCount}
                  onChange={(e) => setInventoryCount(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Product"}
          </button>

          <div className="flex gap-3">
            <Link
              href="/admin/products"
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-brand text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
