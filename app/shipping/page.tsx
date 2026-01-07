"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Truck, Package, Globe, MapPin, Clock } from "lucide-react";
import { getContentSettings, defaultContent, type ShippingContent } from "@/lib/content";

export default function ShippingPage() {
  const [content, setContent] = useState<ShippingContent>(defaultContent.shipping);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      const settings = await getContentSettings();
      setContent(settings.shipping);
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Information</h1>
        <p className="text-gray-600 mb-10">
          Everything you need to know about how we get your order to you.
        </p>

        <div className="space-y-10">
          {/* Shipping Methods */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Shipping Methods</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Method</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Delivery Time</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {content.methods.map((method, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-gray-900 font-medium">{method.name}</td>
                      <td className="px-6 py-4 text-gray-600">{method.timeframe}</td>
                      <td className="px-6 py-4 text-gray-600">{method.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Free Shipping */}
          <section className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-1">Free Shipping Available!</h3>
                <p className="text-green-700">
                  Orders over {content.freeShippingThreshold} qualify for free standard shipping.
                </p>
              </div>
            </div>
          </section>

          {/* Processing Time */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Processing Time</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-600">
                Orders are processed within <span className="font-medium text-gray-900">{content.processingTime}</span>.
                You'll receive a confirmation email with tracking information once your order ships.
              </p>
            </div>
          </section>

          {/* Order Tracking */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Order Tracking</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-600">
                Once your order ships, you'll receive an email with a tracking number.
                Click the link in the email to track your package in real-time and see
                estimated delivery dates.
              </p>
            </div>
          </section>

          {/* International Shipping */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-brand" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">International Shipping</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-600">{content.internationalNote}</p>
            </div>
          </section>

          {/* Questions */}
          <section className="bg-gray-50 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Have Questions?</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about shipping, we're here to help.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors"
            >
              Contact Us
            </Link>
          </section>
        </div>
    </div>
  );
}
