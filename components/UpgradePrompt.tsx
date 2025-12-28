"use client";

import { ArrowUpRight, Lock, Sparkles } from "lucide-react";

interface UpgradePromptProps {
  /**
   * The feature name to display (e.g., "Analytics Dashboard", "Premium Themes")
   */
  feature: string;

  /**
   * Optional description of the feature
   */
  description?: string;

  /**
   * Variant: "inline" for inline text, "card" for full card display
   */
  variant?: "inline" | "card";

  /**
   * Custom class name for additional styling
   */
  className?: string;
}

/**
 * Displays an upgrade prompt for features that require a higher tier.
 *
 * Used when Starter tier users try to access Pro/Hosted features:
 * - Analytics Dashboard
 * - Premium Themes
 * - Custom Domain Settings
 * - Unlimited Products (when at 10 product limit)
 */
export function UpgradePrompt({
  feature,
  description,
  variant = "card",
  className = "",
}: UpgradePromptProps) {
  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1 text-amber-600 text-sm ${className}`}>
        <Lock className="w-3 h-3" />
        <span>Pro feature</span>
      </span>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-amber-600" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            Upgrade to Pro
          </h3>

          <p className="text-gray-600 mb-4">
            {description || `${feature} is available on the Pro plan.`}
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://gosovereign.io/wizard/preview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Upgrade Now
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <a
              href="mailto:info@gosovereign.io?subject=Upgrade%20to%20Pro"
              className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 font-medium px-4 py-2 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-amber-200">
        <p className="text-sm text-amber-700">
          <strong>Pro includes:</strong> Unlimited products, Analytics dashboard, Premium themes, Custom domain support, and Priority support.
        </p>
      </div>
    </div>
  );
}

/**
 * A smaller, more compact upgrade banner for use in sidebars or smaller spaces.
 */
export function UpgradeBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-4 text-white ${className}`}
    >
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Upgrade to Pro</p>
          <p className="text-xs text-amber-100">Unlock all features</p>
        </div>
        <a
          href="https://gosovereign.io/wizard/preview"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-xs font-medium transition-colors"
        >
          Upgrade
        </a>
      </div>
    </div>
  );
}

/**
 * Product limit specific upgrade prompt.
 */
export function ProductLimitPrompt({ className = "" }: { className?: string }) {
  return (
    <UpgradePrompt
      feature="Unlimited Products"
      description="You've reached your 10 product limit. Upgrade to Pro for unlimited products and grow your store without restrictions."
      className={className}
    />
  );
}
