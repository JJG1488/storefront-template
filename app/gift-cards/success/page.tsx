"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Gift, Mail, Check, ArrowLeft } from "lucide-react";
import { getStoreConfig } from "@/lib/store";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const store = getStoreConfig();

  if (!sessionId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Invalid session. Please try again.</p>
        <Link href="/gift-cards" className="text-brand hover:underline mt-4 inline-block">
          Back to Gift Cards
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      {/* Success Animation */}
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <Gift className="w-10 h-10 text-green-600" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3">Gift Card Purchased!</h1>
        <p className="text-gray-600 text-lg">
          Your gift card has been created and is on its way.
        </p>
      </div>

      {/* Email Info */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-brand" />
          What happens next?
        </h2>
        <ul className="space-y-3 text-gray-600">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-medium text-brand">1</span>
            </div>
            <span>
              <strong className="text-gray-900">You&apos;ll receive a confirmation email</strong> with the gift card details.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-medium text-brand">2</span>
            </div>
            <span>
              <strong className="text-gray-900">The recipient will receive their gift card</strong> with the unique code and your personal message.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-medium text-brand">3</span>
            </div>
            <span>
              <strong className="text-gray-900">They can redeem it at checkout</strong> on any order at {store.name}.
            </span>
          </li>
        </ul>
      </div>

      {/* Spam Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
        <strong>Tip:</strong> If you don&apos;t see the emails, check your spam folder.
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/gift-cards"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors"
        >
          <Gift className="w-4 h-4" />
          Buy Another Gift Card
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function GiftCardSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
