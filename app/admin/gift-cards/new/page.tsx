"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gift, Plus, DollarSign, Mail, User, MessageSquare } from "lucide-react";

const PRESET_AMOUNTS = [2500, 5000, 10000, 20000]; // cents

export default function NewGiftCardPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selectedAmount, setSelectedAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [note, setNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const amount = useCustom ? Math.round(parseFloat(customAmount || "0") * 100) : selectedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!recipientEmail) {
      setError("Recipient email is required");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          recipientEmail,
          recipientName: recipientName || null,
          note: note || null,
          sendEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create gift card");
        setSaving(false);
        return;
      }

      router.push(`/admin/gift-cards/${data.giftCard.id}`);
    } catch (err) {
      console.error("Failed to create gift card:", err);
      setError("Failed to create gift card. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/gift-cards"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Gift className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Issue Gift Card</h1>
            <p className="text-gray-500">Create a gift card for promotions or customer service</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Amount *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSelectedAmount(preset);
                  setUseCustom(false);
                }}
                className={`py-3 px-4 rounded-lg border-2 font-semibold transition-colors ${
                  !useCustom && selectedAmount === preset
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                ${preset / 100}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                useCustom
                  ? "border-purple-600 bg-purple-50 text-purple-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-600"
              }`}
            >
              Custom Amount
            </button>
            {useCustom && (
              <div className="relative flex-1 max-w-xs">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  step="0.01"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>

        {/* Recipient Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Recipient Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Optional"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Internal Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Internal Note
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Customer service compensation, promotion code..."
              rows={3}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            This note is for internal use only and won&apos;t be shown to the recipient.
          </p>
        </div>

        {/* Send Email Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Send Email to Recipient</p>
            <p className="text-sm text-gray-500">Deliver the gift card code via email</p>
          </div>
          <button
            type="button"
            onClick={() => setSendEmail(!sendEmail)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              sendEmail ? "bg-purple-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                sendEmail ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Summary */}
        {amount > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-purple-700 font-medium">Gift Card Value</span>
              <span className="text-2xl font-bold text-purple-700">
                ${(amount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Link
            href="/admin/gift-cards"
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || amount <= 0}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Issue Gift Card
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
