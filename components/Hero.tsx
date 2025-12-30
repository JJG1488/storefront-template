import { getStoreConfig } from "@/lib/store";
import type { RuntimeSettings } from "@/lib/settings";

interface HeroProps {
  settings: RuntimeSettings;
}

export function Hero({ settings }: HeroProps) {
  const store = getStoreConfig();

  return (
    <section className="relative">
      {/* Hero Content */}
      <div
        className="py-16 md:py-24 px-4 text-center"
        style={{ backgroundColor: `${store.primaryColor}08` }}
      >
        <div className="max-w-4xl mx-auto">
          {settings.tagline ? (
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {settings.tagline}
            </p>
          ) : (
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover our curated collection of quality products
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#products"
              className="inline-flex items-center justify-center px-8 py-3 bg-brand text-white rounded-lg hover:opacity-90 transition-all hover:shadow-lg font-medium"
            >
              Shop Now
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
            <a
              href="#products"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-brand hover:text-brand transition-all font-medium"
            >
              View Featured
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
