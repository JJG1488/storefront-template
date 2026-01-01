"use client";

import { useState } from "react";
import { Gift, Search, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getStoreConfig } from "@/lib/store";
import { formatGiftCardCode } from "@/lib/gift-cards";

interface BalanceResult {
  code: string;
  balance: number;
  balanceFormatted: string;
}

export default function CheckGiftCardBalancePage() {
  const store = getStoreConfig();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BalanceResult | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          cartTotal: 0, // We just want the balance, not applicable amount
        }),
      });

      const data = await res.json();

      if (!data.valid) {
        setError(data.error || "Gift card not found");
      } else {
        setResult({
          code: data.giftCard.code,
          balance: data.giftCard.balance,
          balanceFormatted: data.giftCard.balanceFormatted,
        });
      }
    } catch (err) {
      console.error("Failed to check balance:", err);
      setError("Failed to check balance. Please try again.");
    }

    setLoading(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatGiftCardCode(e.target.value);
    setCode(formatted);
    setError("");
    setResult(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Check Gift Card Balance</h1>
        <p className="text-gray-600">
          Enter your gift card code to see the remaining balance.
        </p>
      </div>

      <form onSubmit={handleCheck} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Gift Card Code
          </label>
          <div className="relative">
            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="code"
              value={code}
              onChange={handleCodeChange}
              placeholder="GC-XXXX-XXXX-XXXX"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-mono uppercase ${
                error ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
              disabled={loading}
            />
          </div>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full py-3 px-6 bg-brand text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Check Balance
            </>
          )}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-green-700 mb-1">Current Balance</p>
          <p className="text-4xl font-bold text-green-800">{result.balanceFormatted}</p>
          <p className="mt-2 text-sm text-green-600 font-mono">{result.code}</p>
        </div>
      )}

      {/* Links */}
      <div className="mt-8 space-y-3 text-center">
        <Link
          href="/gift-cards"
          className="block text-brand hover:underline"
        >
          Buy a Gift Card
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
