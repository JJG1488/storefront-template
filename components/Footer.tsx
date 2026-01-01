"use client";

import { useState } from "react";
import Link from "next/link";
import { getStoreConfig } from "@/lib/store";
import { Instagram, Facebook, Twitter, Mail, CreditCard, Shield } from "lucide-react";
import type { RuntimeSettings } from "@/lib/settings";

// Payment method icons as simple SVG components
function VisaIcon() {
  return (
    <svg className="h-6 w-auto" viewBox="0 0 48 16" fill="currentColor">
      <path d="M19.5 1.5l-2.8 13h-2.3l2.8-13h2.3zm11.7 8.4l1.2-3.3.7 3.3h-1.9zm2.6 4.6h2.1l-1.9-13h-1.9c-.4 0-.8.3-1 .7l-3.4 12.3h2.4l.5-1.3h2.9l.3 1.3zm-6.5-4.2c0-3.4-4.7-3.6-4.7-5.1 0-.5.5-.9 1.4-.9 1.2 0 2.2.3 2.7.6l.5-2.2c-.7-.3-1.8-.5-2.9-.5-3.1 0-5.2 1.6-5.2 4 0 1.7 1.6 2.7 2.8 3.3 1.2.6 1.7 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.6 0-2.5-.4-3.2-.8l-.6 2.3c.7.3 2.1.6 3.5.6 3.3.1 5.4-1.5 5.4-4zm-13.4-8.8l-4.7 13h-2.5l-2.3-10.4c-.1-.5-.3-.7-.7-.9-.7-.4-1.9-.7-2.9-.9l.1-.5h3.9c.5 0 1 .4 1.1.9l1 5.1 2.4-6h2.6z" />
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg className="h-6 w-auto" viewBox="0 0 32 20" fill="none">
      <circle cx="10" cy="10" r="9" fill="#EB001B" />
      <circle cx="22" cy="10" r="9" fill="#F79E1B" />
      <path d="M16 3.8a9 9 0 010 12.4 9 9 0 000-12.4z" fill="#FF5F00" />
    </svg>
  );
}

function AmexIcon() {
  return (
    <svg className="h-6 w-auto" viewBox="0 0 48 16" fill="currentColor">
      {/* A */}
      <path d="M4 13l3-8h2l3 8h-2l-.5-1.5h-3L6 13H4zm3.5-6l-1 3h2l-1-3z" />
      {/* M */}
      <path d="M13 5h2.5l1.5 5 1.5-5H21v8h-1.5V7l-1.8 6h-1.4l-1.8-6v6H13V5z" />
      {/* E */}
      <path d="M23 5h4v1.5h-2.5v1.5h2.5v1.5h-2.5v2h2.5V13h-4V5z" />
      {/* X */}
      <path d="M29 5h2l1.5 2.5L34 5h2l-2.5 4 2.5 4h-2l-1.5-2.5L31 13h-2l2.5-4L29 5z" />
    </svg>
  );
}

function ApplePayIcon() {
  return (
    <svg className="h-6 w-auto" viewBox="0 0 165 40" fill="currentColor">
      {/* Apple logo */}
      <path d="M20.7 12.2c-.8 1-2.1 1.7-3.3 1.6-.2-1.4.4-2.8 1.2-3.7.9-1 2.2-1.7 3.3-1.7.2 1.4-.4 2.8-1.2 3.8zm1.2 1.9c-1.8-.1-3.4 1-4.2 1-.9 0-2.2-1-3.6-1-1.9 0-3.6 1.1-4.5 2.7-1.9 3.3-.5 8.2 1.4 10.9.9 1.3 2 2.8 3.4 2.8 1.4-.1 1.9-.9 3.5-.9 1.6 0 2.1.9 3.5.9 1.5 0 2.4-1.3 3.3-2.7 1-1.5 1.5-3 1.5-3.1-.1 0-2.8-1.1-2.9-4.3 0-2.7 2.2-4 2.3-4.1-1.3-1.8-3.2-2.1-3.7-2.2z"/>
      {/* "Pay" text */}
      <path d="M43.5 27.8V8.6h7c3.4 0 5.8 2.3 5.8 5.7 0 3.4-2.5 5.7-5.9 5.7h-4.6v7.8h-2.3zm2.3-9.9h3.9c2.3 0 3.7-1.3 3.7-3.6 0-2.3-1.3-3.6-3.7-3.6h-3.9v7.2zm14.1 10.1c-2.2 0-3.6-1.2-3.6-3.1 0-2 1.3-3 3.9-3.2l3.6-.2v-.9c0-1.3-.8-2-2.4-2-1.3 0-2.2.6-2.4 1.5h-2c.1-1.9 1.8-3.4 4.5-3.4 2.7 0 4.4 1.4 4.4 3.7v7.6h-2.1v-1.8h-.1c-.6 1.2-2 2-3.5 2l-.3-.2zm.6-1.8c1.6 0 2.8-1 2.8-2.4v-.9l-3.2.2c-1.4.1-2.2.7-2.2 1.6 0 .9.8 1.5 2.2 1.5h.4zm7.9 5.9v-1.8c.2 0 .5.1.8.1 1.2 0 1.9-.5 2.3-1.8l.2-.7-4.4-12.1h2.4l3.2 9.8h.1l3.1-9.8h2.3l-4.5 12.7c-1 2.9-2.2 3.8-4.7 3.8-.2-.1-.6-.2-.8-.2z"/>
    </svg>
  );
}

interface FooterProps {
  settings: RuntimeSettings;
}

export function Footer({ settings }: FooterProps) {
  const store = getStoreConfig();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubscribed(true);
        setEmail("");
      } else {
        setError(data.error || "Failed to subscribe");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  // Use runtime settings for social links
  const hasSocialLinks = settings.instagramUrl || settings.facebookUrl || settings.twitterUrl || settings.tiktokUrl;

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={store.name}
                className="h-10 mb-4"
              />
            ) : (
              <h3 className="text-xl font-bold mb-4">{store.name}</h3>
            )}
            {settings.aboutText && (
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                {settings.aboutText}
              </p>
            )}
            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex gap-4 mt-4">
                {settings.instagramUrl && (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {settings.facebookUrl && (
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {settings.twitterUrl && (
                  <a
                    href={settings.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#products" className="text-gray-400 hover:text-white transition-colors text-sm">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/#featured" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Featured
                </Link>
              </li>
              <li>
                <Link href="/#new" className="text-gray-400 hover:text-white transition-colors text-sm">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/gift-cards" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Gift Cards
                </Link>
              </li>
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Help</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe for exclusive offers and updates.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-green-400">
                <Mail className="w-5 h-5" />
                <span className="text-sm">Thanks for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "..." : "Join"}
                  </button>
                </div>
                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright & Links */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} {store.name}. All rights reserved.
              </p>
              <div className="flex gap-4 text-sm">
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms
                </Link>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-gray-500 text-xs">We accept:</span>
              <div className="flex items-center gap-2 text-gray-400 flex-shrink-0">
                <VisaIcon />
                <MastercardIcon />
                <AmexIcon />
                <ApplePayIcon />
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-xs">
            <Shield className="w-4 h-4" />
            <span>Secure checkout powered by Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
