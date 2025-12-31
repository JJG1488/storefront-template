// Content management for admin-editable pages
// Fetches from settings API with sensible defaults

export interface ShippingMethod {
  name: string;
  timeframe: string;
  cost: string;
}

export interface ShippingContent {
  methods: ShippingMethod[];
  freeShippingThreshold: string;
  processingTime: string;
  internationalNote: string;
}

export interface ReturnsContent {
  policyDays: number;
  conditions: string[];
  process: string[];
  exchangeNote: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ContentSettings {
  shipping: ShippingContent;
  returns: ReturnsContent;
  faq: FAQItem[];
}

// Default content - used if store owner hasn't customized
export const defaultContent: ContentSettings = {
  shipping: {
    methods: [
      { name: "Standard Shipping", timeframe: "5-7 business days", cost: "$5.99" },
      { name: "Express Shipping", timeframe: "2-3 business days", cost: "$12.99" },
    ],
    freeShippingThreshold: "$50",
    processingTime: "1-2 business days",
    internationalNote: "Contact us for international shipping rates and availability.",
  },
  returns: {
    policyDays: 30,
    conditions: [
      "Item must be unused and in original packaging",
      "Tags must be attached",
      "Receipt or proof of purchase required",
    ],
    process: [
      "Contact us at our email address to initiate a return",
      "We'll send you a prepaid return shipping label",
      "Ship the item back within 7 days",
      "Refund processed within 5-7 business days after we receive the item",
    ],
    exchangeNote: "For exchanges, please contact us and we'll help you find the right size or product.",
  },
  faq: [
    {
      question: "How do I track my order?",
      answer: "Once your order ships, you'll receive an email with a tracking number. Click the link in the email to track your package in real-time.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), as well as Apple Pay and Google Pay through our secure checkout.",
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping takes 5-7 business days, while Express shipping takes 2-3 business days. Orders are processed within 1-2 business days.",
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy. Items must be unused, in original packaging with tags attached. Contact us to initiate a return.",
    },
    {
      question: "Do you ship internationally?",
      answer: "We currently ship within the United States. For international orders, please contact us and we'll do our best to accommodate your request.",
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach us through our Contact Us page, or email us directly. We typically respond within 24-48 hours.",
    },
  ],
};

// Fetch content from public store content API, falling back to defaults
export async function getContentSettings(): Promise<ContentSettings> {
  try {
    // Use public endpoint (no auth required) with cache-busting
    const res = await fetch("/api/store/content", {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
    if (res.ok) {
      const data = await res.json();
      // API already returns merged content with defaults
      return {
        shipping: data.shipping || defaultContent.shipping,
        returns: data.returns || defaultContent.returns,
        faq: data.faq?.length > 0 ? data.faq : defaultContent.faq,
      };
    }
  } catch (error) {
    console.error("Failed to fetch content settings:", error);
  }
  return defaultContent;
}

// Server-side fetch for static/SSR pages
export async function getContentSettingsServer(baseUrl?: string): Promise<ContentSettings> {
  // For server-side rendering, we return defaults
  // In a full implementation, this would query the database directly
  return defaultContent;
}
