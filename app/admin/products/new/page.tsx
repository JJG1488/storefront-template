"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductLimitPrompt } from "@/components/UpgradePrompt";
import { ImageUpload } from "@/components/ImageUpload";
import { FileUpload } from "@/components/FileUpload";
import { Download } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("active");
  const [trackInventory, setTrackInventory] = useState(false);
  const [inventoryCount, setInventoryCount] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Digital product fields
  const [isDigital, setIsDigital] = useState(false);
  const [digitalFilePath, setDigitalFilePath] = useState("");
  const [digitalFileName, setDigitalFileName] = useState("");
  const [digitalFileSize, setDigitalFileSize] = useState(0);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate all required fields
    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a product description.");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (!imageUrl) {
      setError("Please upload a product image.");
      return;
    }
    // Validate digital file if digital product
    if (isDigital && !digitalFilePath) {
      setError("Please upload a digital file for this product.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: parseFloat(price) || 0,
          status,
          track_inventory: isDigital ? false : trackInventory, // Digital products don't track inventory
          inventory_count: isDigital ? null : (trackInventory ? parseInt(inventoryCount) || 0 : null),
          images: imageUrl ? [{ url: imageUrl, alt: name.trim(), position: 0 }] : [],
          // Digital product fields
          is_digital: isDigital,
          digital_file_url: isDigital ? digitalFilePath : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();

        // Handle product limit error (403)
        if (res.status === 403 && data.upgrade) {
          setLimitReached(true);
          setError(data.detail || "Product limit reached. Upgrade to Pro for unlimited products.");
          return;
        }

        throw new Error(data.detail || data.error || "Failed to create product");
      }

      router.push("/admin/products");
    } catch (err) {
      console.error("Create error:", err);
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add New Product</h1>
        <Link
          href="/admin/products"
          className="text-gray-600 hover:text-gray-900"
        >
          &larr; Back to Products
        </Link>
      </div>

      {/* Show upgrade prompt when product limit is reached */}
      {limitReached && (
        <div className="mb-6">
          <ProductLimitPrompt />
        </div>
      )}

      {error && !limitReached && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
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
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              required
            />
          </div>

          <ImageUpload value={imageUrl} onChange={setImageUrl} required />

          {/* Digital Product Toggle */}
          <div className="border-t pt-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isDigital}
                onChange={(e) => {
                  setIsDigital(e.target.checked);
                  // Auto-disable inventory tracking for digital products
                  if (e.target.checked) {
                    setTrackInventory(false);
                  }
                }}
                className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <div>
                <span className="font-medium flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Digital Product
                </span>
                <p className="text-sm text-gray-500">
                  Customers will receive a download link after purchase
                </p>
              </div>
            </label>

            {isDigital && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <FileUpload
                  value={digitalFilePath}
                  onChange={(path, metadata) => {
                    setDigitalFilePath(path);
                    if (metadata) {
                      setDigitalFileName(metadata.name);
                      setDigitalFileSize(metadata.size);
                    }
                  }}
                  fileName={digitalFileName}
                  fileSize={digitalFileSize}
                />
              </div>
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
            </select>
          </div>

          {/* Inventory tracking - hidden for digital products */}
          {!isDigital && (
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
                    Initial Inventory Count
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
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
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
            {saving ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
