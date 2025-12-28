"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getTermsOfService } from "@/content/legal";

export default function TermsPage() {
  const terms = getTermsOfService();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
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

      {/* Header */}
      <div className="mb-10">
        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-brand" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{terms.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>Effective: {terms.effectiveDate}</span>
          <span>Last Updated: {terms.lastUpdated}</span>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {terms.sections.map((section, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {section.title}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 bg-gray-50 rounded-xl p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Questions about these terms?
        </h3>
        <p className="text-gray-600 mb-6">
          If you have any questions about our Terms of Service, please reach out.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
