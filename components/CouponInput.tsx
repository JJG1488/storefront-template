"use client";

import { useState } from "react";
import { Tag, X, Check, Loader2 } from "lucide-react";

interface AppliedCoupon {
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
}

interface CouponInputProps {
  cartTotal: number;
  appliedCoupon: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
}

export function CouponInput({ cartTotal, appliedCoupon, onApply, onRemove }: CouponInputProps) {
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
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          cartTotal,
        }),
      });

      const data = await res.json();

      if (!data.valid) {
        setError(data.error || "Invalid coupon code");
        setLoading(false);
        return;
      }

      // Success!
      setSuccess(true);
      onApply(data.coupon);
      setCode("");

      // Reset success after a moment
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to validate coupon:", err);
      setError("Failed to apply coupon. Please try again.");
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  // If coupon is applied, show it
  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-green-600" />
            <span className="font-mono font-semibold text-green-900">{appliedCoupon.code}</span>
            <span className="text-green-700">
              {appliedCoupon.discountType === "percentage"
                ? `${appliedCoupon.discountValue}% off`
                : `$${appliedCoupon.discountValue.toFixed(2)} off`}
            </span>
          </div>
          <button
            onClick={onRemove}
            className="p-1 text-green-600 hover:text-red-600 transition-colors"
            title="Remove coupon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-green-700 mt-1">
          You save ${appliedCoupon.discountAmount.toFixed(2)}!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter coupon code"
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
