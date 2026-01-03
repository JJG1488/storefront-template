import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import { Testimonials } from "@/components/Testimonials";
import { VideoBanner } from "@/components/VideoBanner";
import { TrustBadges } from "@/components/TrustBadges";
import { Truck, Shield, RotateCcw } from "lucide-react";
import { getProducts } from "@/data/products";
import { getVideoBannerSettings } from "@/lib/video-banner";
import { getStoreSettingsFromDB } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [products, videoBannerSettings, settings] = await Promise.all([
    getProducts(),
    getVideoBannerSettings(),
    getStoreSettingsFromDB(),
  ]);

  return (
    <>
      <VideoBanner {...videoBannerSettings} />
      <Hero settings={settings} />
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <ProductGrid products={products} />
        </div>
      </section>
      <Testimonials />

      {/* Trust Badges Section */}
      <section className="bg-white py-12 px-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <TrustBadges
            badges={[
              {
                icon: <Truck className="w-6 h-6" />,
                title: "Free Shipping",
                description: settings.shippingPromise || "On orders over $50",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Secure Checkout",
                description: "SSL encrypted payment",
              },
              {
                icon: <RotateCcw className="w-6 h-6" />,
                title: "Easy Returns",
                description: settings.returnPolicy || "30-day return policy",
              },
            ]}
            variant="horizontal"
          />
        </div>
      </section>
    </>
  );
}
