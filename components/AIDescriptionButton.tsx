"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

interface Props {
  productName: string;
  onGenerated: (description: string) => void;
  disabled?: boolean;
}

export function AIDescriptionButton({ productName, onGenerated, disabled }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!productName.trim()) {
      setError("Enter a product name first");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName: productName.trim(),
          tone: "professional",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate description");
      }

      const data = await response.json();
      onGenerated(data.description);
      setHasGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = disabled || isGenerating || !productName.trim();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isDisabled}
        className={`
          inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
          transition-all duration-200
          ${isDisabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-sm hover:shadow"
          }
        `}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : hasGenerated ? (
          <>
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {!productName.trim() && !error && (
        <p className="text-xs text-gray-500">Enter a product name first</p>
      )}
    </div>
  );
}
