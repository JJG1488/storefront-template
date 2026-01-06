"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

// Content types supported by the enhance API
type ContentType =
  | "collection"
  | "about"
  | "faq"
  | "shipping"
  | "returns"
  | "service"
  | "generic";

// Human-readable labels for each content type
const contentLabels: Record<ContentType, string> = {
  collection: "description",
  about: "about section",
  faq: "answer",
  shipping: "shipping note",
  returns: "returns note",
  service: "description",
  generic: "content",
};

// Validation messages for each content type
const validationMessages: Record<ContentType, string> = {
  collection: "Enter a collection name first",
  about: "Enter a store name first",
  faq: "Enter a question first",
  shipping: "Enter a store name first",
  returns: "Enter a store name first",
  service: "Enter a service name first",
  generic: "Enter a name first",
};

interface AIEnhanceButtonProps {
  contentType: ContentType;
  contextName: string;
  currentText?: string;
  additionalContext?: string;
  onEnhanced: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AIEnhanceButton({
  contentType,
  contextName,
  currentText,
  additionalContext,
  onEnhanced,
  disabled,
  className = "",
}: AIEnhanceButtonProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [hasEnhanced, setHasEnhanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnhance = async () => {
    if (!contextName.trim()) {
      setError(validationMessages[contentType] || "Enter a name first");
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/enhance-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentType,
          contextName: contextName.trim(),
          currentText: currentText?.trim() || undefined,
          additionalContext: additionalContext?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to enhance");
      }

      const data = await response.json();
      onEnhanced(data.result);
      setHasEnhanced(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enhancement failed");
    } finally {
      setIsEnhancing(false);
    }
  };

  const isDisabled = disabled || isEnhancing || !contextName.trim();
  const label = contentLabels[contentType] || "content";

  const buttonText = hasEnhanced
    ? "Try Again"
    : currentText?.trim()
    ? `Enhance ${label}`
    : `Generate ${label}`;

  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleEnhance}
        disabled={isDisabled}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg
          transition-all duration-200
          ${
            isDisabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-sm hover:shadow"
          }
        `}
      >
        {isEnhancing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enhancing...
          </>
        ) : hasEnhanced ? (
          <>
            <RefreshCw className="w-4 h-4" />
            {buttonText}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {buttonText}
          </>
        )}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {!contextName.trim() && !error && (
        <p className="text-xs text-gray-500">
          {validationMessages[contentType] || "Enter a name first"}
        </p>
      )}
    </div>
  );
}
