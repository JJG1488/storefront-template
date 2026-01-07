"use client";

import { useState } from "react";
import { Gift, Mail, User, MessageSquare, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getStoreConfig } from "@/lib/store";
import { GIFT_CARD_AMOUNTS, formatGiftCardAmount } from "@/lib/gift-cards";

export default function GiftCardsPage() {
  const store = getStoreConfig();
  const [selectedAmount, setSelectedAmount] = useState<number>(GIFT_CARD_AMOUNTS[1]); // Default $50
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!senderEmail.trim()) {
      newErrors.senderEmail = "Your email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      newErrors.senderEmail = "Please enter a valid email";
    }

    if (!recipientEmail.trim()) {
      newErrors.recipientEmail = "Recipient email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      newErrors.recipientEmail = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/gift-cards/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedAmount,
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim() || null,
          senderEmail: senderEmail.trim(),
          senderName: senderName.trim() || null,
          giftMessage: giftMessage.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setErrors({ form: error instanceof Error ? error.message : "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-brand" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Gift Cards</h1>
        <p className="text-gray-600">
          Give the gift of choice! {store.name} gift cards never expire and can be used on any order.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Amount
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GIFT_CARD_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setSelectedAmount(amount)}
                className={`relative py-4 px-3 rounded-xl border-2 transition-all ${
                  selectedAmount === amount
                    ? "border-brand bg-brand/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {selectedAmount === amount && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-brand" />
                  </div>
                )}
                <span className="text-xl font-bold">
                  {formatGiftCardAmount(amount)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recipient Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-400" />
            Recipient Details
          </h2>

          <div>
            <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="recipientEmail"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="friend@example.com"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 ${
                errors.recipientEmail ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.recipientEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.recipientEmail}</p>
            )}
          </div>

          <div>
            <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Their name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        </div>

        {/* Sender Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Your Details
          </h2>

          <div>
            <label htmlFor="senderEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Your Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="senderEmail"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 ${
                errors.senderEmail ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.senderEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.senderEmail}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              We&apos;ll send you a purchase confirmation.
            </p>
          </div>

          <div>
            <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              id="senderName"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        </div>

        {/* Gift Message */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            Gift Message <span className="text-sm font-normal text-gray-400">(optional)</span>
          </h2>
          <textarea
            id="giftMessage"
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            placeholder="Add a personal message for the recipient..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
          />
          <p className="mt-1 text-sm text-gray-500 text-right">
            {giftMessage.length}/500
          </p>
        </div>

        {/* Error Message */}
        {errors.form && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {errors.form}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-brand text-white font-semibold rounded-xl hover:bg-brand-hover active:bg-brand-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Gift className="w-5 h-5" />
              Buy {formatGiftCardAmount(selectedAmount)} Gift Card
            </>
          )}
        </button>

        {/* Info */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              Gift cards never expire
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              Use on any order - partial use keeps the balance
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              Recipient receives email with gift card code instantly
            </li>
          </ul>
        </div>
      </form>

      {/* Back to Shopping */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
