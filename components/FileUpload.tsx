"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, FileText, File } from "lucide-react";

interface FileUploadProps {
  value: string;
  onChange: (path: string, metadata?: { name: string; size: number; type: string }) => void;
  fileName?: string;
  fileSize?: number;
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Get file icon based on type
function getFileIcon(type: string) {
  if (type.startsWith("application/pdf")) return "📄";
  if (type.includes("zip") || type.includes("rar")) return "📦";
  if (type.startsWith("audio/")) return "🎵";
  if (type.startsWith("video/")) return "🎬";
  if (type.startsWith("image/")) return "🖼️";
  return "📁";
}

export function FileUpload({ value, onChange, fileName, fileSize }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedName, setUploadedName] = useState(fileName || "");
  const [uploadedSize, setUploadedSize] = useState(fileSize || 0);
  const [uploadedType, setUploadedType] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError("");

      try {
        const token = localStorage.getItem("admin_token");
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload-file", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const { path, originalName, size, type } = await res.json();
        setUploadedName(originalName);
        setUploadedSize(size);
        setUploadedType(type);
        onChange(path, { name: originalName, size, type });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleRemove = useCallback(() => {
    onChange("");
    setUploadedName("");
    setUploadedSize(0);
    setUploadedType("");
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Digital File <span className="text-red-500">*</span>
      </label>

      {value ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getFileIcon(uploadedType)}</span>
              <div>
                <p className="font-medium text-gray-900 truncate max-w-xs">
                  {uploadedName}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(uploadedSize)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-500 hover:text-red-600 p-1"
              title="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-brand bg-brand/5"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-brand animate-spin mb-2" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <>
              <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Drag and drop your file, or click to select
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, ZIP, MP3, MP4, and more (size limit based on plan)
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
