"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles } from "lucide-react";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function NewCouponPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minimumOrderAmount, setMinimumOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleGenerateCode = () => {
    setCode(generateCode());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          description,
          discountType,
          discountValue: parseFloat(discountValue),
          minimumOrderAmount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : 0,
          maxUses: maxUses ? parseInt(maxUses) : null,
          startsAt: startsAt || null,
          expiresAt: expiresAt || null,
          isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create coupon");
        setSaving(false);
        return;
      }

      router.push("/admin/coupons");
    } catch (err) {
      console.error("Failed to create coupon:", err);
      setError("Failed to create coupon. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/coupons"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Coupon</h1>
          <p className="text-gray-500">Set up a new discount code for your customers</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coupon Code *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-mono uppercase"
              required
              minLength={3}
            />
            <button
              type="button"
              onClick={handleGenerateCode}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Customers will enter this code at checkout
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Summer sale - 20% off everything"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Internal note to help you remember what this coupon is for
          </p>
        </div>

        {/* Discount Type & Value */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type *
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {discountType === "percentage" ? "Percentage Off *" : "Amount Off *"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {discountType === "percentage" ? "%" : "$"}
              </span>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "20" : "10.00"}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                required
                min="0.01"
                max={discountType === "percentage" ? "100" : undefined}
                step={discountType === "percentage" ? "1" : "0.01"}
              />
            </div>
          </div>
        </div>

        {/* Minimum Order Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Order Amount
          </label>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={minimumOrderAmount}
              onChange={(e) => setMinimumOrderAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Leave blank for no minimum
          </p>
        </div>

        {/* Max Uses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Usage Limit
          </label>
          <input
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Unlimited"
            className="max-w-xs w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            min="1"
          />
          <p className="mt-1 text-sm text-gray-500">
            Leave blank for unlimited uses
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiration Date
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Active</p>
            <p className="text-sm text-gray-500">Enable this coupon for immediate use</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isActive ? "bg-brand" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isActive ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Link
            href="/admin/coupons"
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Coupon
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
