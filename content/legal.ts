// Legal content for store Terms of Service and Privacy Policy pages
// This content is customizable for each store

import { getStoreConfig } from "@/lib/store";

export interface LegalSection {
  title: string;
  content: string;
}

export interface LegalDocument {
  title: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function getTermsOfService(): LegalDocument {
  const store = getStoreConfig();
  const storeName = store.name || "Our Store";
  const contactEmail = store.contactEmail || "contact@store.com";

  return {
    title: "Terms of Service",
    effectiveDate: "January 1, 2025",
    lastUpdated: "December 2024",
    sections: [
      {
        title: "1. Acceptance of Terms",
        content: `By accessing or using ${storeName}'s website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.`,
      },
      {
        title: "2. Products and Services",
        content: `${storeName} offers products and services as described on our website. We reserve the right to modify, discontinue, or update our offerings at any time without prior notice.`,
      },
      {
        title: "3. Orders and Payment",
        content: `All orders are subject to acceptance and availability. Prices are displayed in the currency shown at checkout. Payment is processed securely through Stripe. We reserve the right to refuse or cancel any order for any reason.`,
      },
      {
        title: "4. Shipping and Delivery",
        content: `Shipping times and costs are calculated at checkout based on your location. Delivery times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers or customs processing.`,
      },
      {
        title: "5. Returns and Refunds",
        content: `Please review our return policy for information about returns and refunds. Items must be returned in their original condition. Refund processing times may vary depending on your payment method.`,
      },
      {
        title: "6. Intellectual Property",
        content: `All content on this website, including images, text, logos, and designs, is the property of ${storeName} or its licensors and is protected by intellectual property laws. You may not reproduce, distribute, or use our content without permission.`,
      },
      {
        title: "7. User Conduct",
        content: `You agree not to use our website for any unlawful purpose, attempt to gain unauthorized access to our systems, interfere with the operation of our website, or engage in any conduct that could damage our reputation or business.`,
      },
      {
        title: "8. Privacy",
        content: `Your use of our website is also governed by our Privacy Policy. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.`,
      },
      {
        title: "9. Limitation of Liability",
        content: `${storeName} is not liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products. Our total liability is limited to the amount you paid for the product or service in question.`,
      },
      {
        title: "10. Modifications to Terms",
        content: `We may update these terms from time to time. Changes will be posted on this page with an updated effective date. Your continued use of our website after changes constitutes acceptance of the new terms.`,
      },
      {
        title: "11. Contact Information",
        content: `For questions about these terms, please contact us at ${contactEmail}.`,
      },
    ],
  };
}

export function getPrivacyPolicy(): LegalDocument {
  const store = getStoreConfig();
  const storeName = store.name || "Our Store";
  const contactEmail = store.contactEmail || "contact@store.com";

  return {
    title: "Privacy Policy",
    effectiveDate: "January 1, 2025",
    lastUpdated: "December 2024",
    sections: [
      {
        title: "1. Information We Collect",
        content: `We collect information you provide when placing an order (name, email, shipping address, payment information), information collected automatically (IP address, browser type, pages visited), and information from third parties (payment processor verification).`,
      },
      {
        title: "2. How We Use Your Information",
        content: `We use your information to process and fulfill orders, communicate with you about your orders, improve our website and services, send marketing communications (with your consent), and comply with legal obligations.`,
      },
      {
        title: "3. Information Sharing",
        content: `We share information with service providers who help us operate our business (payment processors, shipping carriers). We may also share information when required by law or to protect our rights. We do not sell your personal information to third parties.`,
      },
      {
        title: "4. Payment Security",
        content: `All payment information is processed securely through Stripe. We do not store your credit card details on our servers. Stripe is PCI-DSS compliant and uses industry-standard encryption to protect your payment information.`,
      },
      {
        title: "5. Cookies",
        content: `We use essential cookies for site functionality (shopping cart, authentication). We may use analytics cookies to understand how visitors use our site. You can manage cookie preferences in your browser settings.`,
      },
      {
        title: "6. Data Retention",
        content: `We retain order information for as long as necessary to fulfill orders, provide customer service, and comply with legal requirements. You can request deletion of your personal information by contacting us.`,
      },
      {
        title: "7. Your Rights",
        content: `You have the right to access, correct, or delete your personal information. You can opt out of marketing communications at any time. To exercise these rights, please contact us at ${contactEmail}.`,
      },
      {
        title: "8. Security",
        content: `We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`,
      },
      {
        title: "9. Third-Party Links",
        content: `Our website may contain links to third-party websites. We are not responsible for the privacy practices of these websites. We encourage you to review the privacy policies of any third-party sites you visit.`,
      },
      {
        title: "10. Children's Privacy",
        content: `Our services are not intended for children under 13. We do not knowingly collect information from children. If you believe a child has provided us with personal information, please contact us.`,
      },
      {
        title: "11. Changes to This Policy",
        content: `We may update this privacy policy from time to time. Changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically.`,
      },
      {
        title: "12. Contact Us",
        content: `For privacy-related questions, please contact us at ${contactEmail}.`,
      },
    ],
  };
}
