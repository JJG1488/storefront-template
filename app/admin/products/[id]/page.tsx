"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/ImageUpload";
import { FileUpload } from "@/components/FileUpload";
import { AIDescriptionButton } from "@/components/AIDescriptionButton";
import { VariantEditor, VariantOption } from "@/components/VariantEditor";
import { Download } from "lucide-react";

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
  // Digital product fields
  is_digital: boolean;
  digital_file_url: string | null;
  // Variant fields
  has_variants: boolean;
  variant_options: VariantOption[];
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

  // Digital product fields
  const [isDigital, setIsDigital] = useState(false);
  const [digitalFilePath, setDigitalFilePath] = useState("");
  const [digitalFileName, setDigitalFileName] = useState("");
  const [digitalFileSize, setDigitalFileSize] = useState(0);

  // Variant fields
  const [hasVariants, setHasVariants] = useState(false);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);

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
        // Set digital product fields
        setIsDigital(product.is_digital || false);
        setDigitalFilePath(product.digital_file_url || "");
        // Set variant fields
        setHasVariants(product.has_variants || false);
        setVariantOptions(product.variant_options || []);
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
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: parseFloat(price) || 0,
          status,
          // For products with variants, inventory is tracked per-variant
          track_inventory: hasVariants ? false : (isDigital ? false : trackInventory),
          inventory_count: hasVariants ? null : (isDigital ? null : (trackInventory ? parseInt(inventoryCount) || 0 : null)),
          images: imageUrl ? [{ url: imageUrl, alt: name.trim(), position: 0 }] : [],
          // Digital product fields
          is_digital: isDigital,
          digital_file_url: isDigital ? digitalFilePath : null,
          // Variant fields
          has_variants: hasVariants,
          variant_options: variantOptions,
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
            <div className="flex justify-end mt-2">
              <AIDescriptionButton
                productName={name}
                onGenerated={setDescription}
                disabled={saving}
              />
            </div>
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
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Inventory tracking - hidden for digital products and products with variants */}
          {!isDigital && !hasVariants && (
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
          )}

          {/* Variant Editor - hidden for digital products */}
          {!isDigital && (
            <VariantEditor
              productId={productId}
              basePrice={Math.round((parseFloat(price) || 0) * 100)}
              hasVariants={hasVariants}
              variantOptions={variantOptions}
              onVariantOptionsChange={setVariantOptions}
              onHasVariantsChange={setHasVariants}
            />
          )}
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
