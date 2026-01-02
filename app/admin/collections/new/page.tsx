"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, X } from "lucide-react";

export default function NewCollectionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          imageUrl,
          isActive,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/collections/${data.collection.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create collection");
      }
    } catch (err) {
      console.error("Failed to create collection:", err);
      setError("Failed to create collection");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/collections"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Collection</h1>
          <p className="text-gray-500">Create a new product collection</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Collection"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this collection..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection Image
            </label>
            {imageUrl ? (
              <div className="relative inline-block">
                <img
                  src={imageUrl}
                  alt="Collection"
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Upload</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
            </label>
            <span className="text-sm text-gray-700">
              {isActive ? "Visible on storefront" : "Hidden from storefront"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Create Collection
          </button>
          <Link
            href="/admin/collections"
            className="px-6 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
