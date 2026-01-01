"use client";

import { useState } from "react";
import { Gift, X, Check, Loader2 } from "lucide-react";
import { formatGiftCardCode } from "@/lib/gift-cards";

export interface AppliedGiftCard {
  code: string;
  balance: number;
  balanceFormatted: string;
  applicableAmount: number;
  applicableAmountFormatted: string;
}

interface GiftCardInputProps {
  cartTotal: number;
  appliedGiftCard: AppliedGiftCard | null;
  onApply: (giftCard: AppliedGiftCard) => void;
  onRemove: () => void;
}

export function GiftCardInput({
  cartTotal,
  appliedGiftCard,
  onApply,
  onRemove,
}: GiftCardInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          cartTotal,
        }),
      });

      const data = await res.json();

      if (!data.valid) {
        setError(data.error || "Invalid gift card code");
        setLoading(false);
        return;
      }

      // Success!
      setSuccess(true);
      onApply(data.giftCard);
      setCode("");

      // Reset success after a moment
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to validate gift card:", err);
      setError("Failed to apply gift card. Please try again.");
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatGiftCardCode(e.target.value);
    setCode(formatted);
    setError("");
  };

  // If gift card is applied, show it
  if (appliedGiftCard) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-600" />
            <span className="font-mono font-semibold text-purple-900">
              {appliedGiftCard.code}
            </span>
          </div>
          <button
            onClick={onRemove}
            className="p-1 text-purple-600 hover:text-red-600 transition-colors"
            title="Remove gift card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-sm text-purple-700 space-y-1">
          <p>
            Balance: <span className="font-semibold">{appliedGiftCard.balanceFormatted}</span>
          </p>
          <p className="text-purple-800 font-medium">
            -{appliedGiftCard.applicableAmountFormatted} applied to this order
          </p>
          {appliedGiftCard.balance > appliedGiftCard.applicableAmount && (
            <p className="text-purple-600 text-xs">
              Remaining balance after purchase: $
              {(appliedGiftCard.balance - appliedGiftCard.applicableAmount).toFixed(2)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            placeholder="Gift card code (GC-XXXX-XXXX-XXXX)"
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-mono uppercase ${
              error ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
            disabled={loading}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success ? (
            <Check className="w-4 h-4" />
          ) : (
            "Apply"
          )}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
