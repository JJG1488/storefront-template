import { Truck, Shield, RotateCcw, CreditCard, Clock, Award } from "lucide-react";

interface TrustBadge {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const defaultBadges: TrustBadge[] = [
  {
    icon: <Truck className="w-6 h-6" />,
    title: "Free Shipping",
    description: "On orders over $50",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure Checkout",
    description: "SSL encrypted payment",
  },
  {
    icon: <RotateCcw className="w-6 h-6" />,
    title: "Easy Returns",
    description: "30-day return policy",
  },
];

interface TrustBadgesProps {
  badges?: TrustBadge[];
  variant?: "horizontal" | "vertical" | "compact";
  className?: string;
}

export function TrustBadges({
  badges = defaultBadges,
  variant = "horizontal",
  className = "",
}: TrustBadgesProps) {
  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 ${className}`}>
        {badges.map((badge, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className="text-brand">{badge.icon}</span>
            <span>{badge.title}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={`space-y-3 ${className}`}>
        {badges.map((badge, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand">
              {badge.icon}
            </div>
            <div>
              <p className="font-medium text-gray-900">{badge.title}</p>
              <p className="text-sm text-gray-500">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: horizontal cards
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex flex-col items-center text-center p-4 bg-white rounded-lg border border-gray-100 shadow-sm"
        >
          <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center text-brand mb-3">
            {badge.icon}
          </div>
          <h3 className="font-semibold text-gray-900">{badge.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
        </div>
      ))}
    </div>
  );
}

// Pre-configured badge sets for different use cases
export const shippingBadges: TrustBadge[] = [
  {
    icon: <Truck className="w-6 h-6" />,
    title: "Free Shipping",
    description: "On orders over $50",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Fast Delivery",
    description: "2-5 business days",
  },
];

export const securityBadges: TrustBadge[] = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure Checkout",
    description: "SSL encrypted",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Safe Payment",
    description: "Stripe secured",
  },
];

export const qualityBadges: TrustBadge[] = [
  {
    icon: <Award className="w-6 h-6" />,
    title: "Premium Quality",
    description: "Satisfaction guaranteed",
  },
  {
    icon: <RotateCcw className="w-6 h-6" />,
    title: "Easy Returns",
    description: "30-day policy",
  },
];
