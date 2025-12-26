"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, CheckCircle, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";
import { getContentSettings, defaultContent, type ReturnsContent } from "@/lib/content";

export default function ReturnsPage() {
  const [content, setContent] = useState<ReturnsContent>(defaultContent.returns);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      const settings = await getContentSettings();
      setContent(settings.returns);
      setLoading(false);
    }
    loadContent();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Returns & Exchanges</h1>
        <p className="text-gray-600 mb-10">
          We want you to love your purchase. If something isn't right, we're here to help.
        </p>

        <div className="space-y-10">
          {/* Return Policy */}
          <section className="bg-brand/5 border border-brand/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{content.policyDays}-Day Return Policy</h2>
                <p className="text-gray-600">
                  You have {content.policyDays} days from the delivery date to return your purchase for a full refund.
                  We believe in making returns as simple as possible.
                </p>
              </div>
            </div>
          </section>

          {/* Return Conditions */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Return Conditions</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-600 mb-4">To be eligible for a return, your item must meet the following conditions:</p>
              <ul className="space-y-3">
                {content.conditions.map((condition, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Non-Returnable Items */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Non-Returnable Items</h2>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <p className="text-amber-800">
                Some items cannot be returned for health and safety reasons, including:
              </p>
              <ul className="mt-3 space-y-2 text-amber-700">
                <li>• Personalized or custom-made items</li>
                <li>• Intimate or sanitary goods</li>
                <li>• Perishable items</li>
                <li>• Sale items (unless defective)</li>
              </ul>
            </div>
          </section>

          {/* How to Return */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">How to Return an Item</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="space-y-4">
                {content.process.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Exchanges */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Exchanges</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-600">{content.exchangeNote}</p>
            </div>
          </section>

          {/* Refund Info */}
          <section className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Refund Information</h3>
            <p className="text-green-700">
              Once we receive your return, we'll inspect the item and process your refund within 5-7 business days.
              The refund will be credited to your original payment method. Please note that it may take additional
              time for the refund to appear in your account depending on your bank or credit card company.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gray-50 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help with a Return?</h3>
            <p className="text-gray-600 mb-4">
              Our support team is ready to assist you with your return or exchange.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Contact Us
            </Link>
          </section>
        </div>
    </div>
  );
}
