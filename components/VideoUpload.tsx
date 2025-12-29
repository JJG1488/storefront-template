"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Video } from "lucide-react";

interface VideoUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function VideoUpload({ value, onChange }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      // Validate file type on client
      const allowedTypes = ["video/mp4", "video/webm"];
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload an MP4 or WebM video.");
        return;
      }

      // Validate file size on client (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError("Video must be less than 50MB.");
        return;
      }

      setUploading(true);
      setError("");

      try {
        const token = localStorage.getItem("admin_token");
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload-video", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const { url } = await res.json();
        onChange(url);
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
      if (file && file.type.startsWith("video/")) {
        handleUpload(file);
      } else {
        setError("Please drop a video file.");
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
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onChange]);

  return (
    <div>
      {value ? (
        <div className="relative">
          <video
            src={value}
            className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
            muted
            playsInline
            controls
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-sm"
            title="Remove video"
          >
            <X className="w-4 h-4" />
          </button>
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
              <p className="text-sm text-gray-500">Uploading video...</p>
            </div>
          ) : (
            <>
              <Video className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Drag and drop a video, or click to select
              </p>
              <p className="text-xs text-gray-400 mt-1">
                MP4 or WebM (max 50MB)
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
