"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Store, Megaphone, Truck, Users, Check, HelpCircle, Plus, Trash2, GripVertical, BookOpen, Download, Globe, ExternalLink, Palette, Lock, Sparkles, Video, Youtube, Upload } from "lucide-react";
import { VideoUpload } from "@/components/VideoUpload";
import { defaultContent, type ShippingMethod, type FAQItem } from "@/lib/content";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { allThemes, getAvailableThemes, type ThemePreset } from "@/lib/themes";

interface VideoBannerSettings {
  enabled: boolean;
  type: "youtube" | "upload";
  youtubeUrl: string;
  uploadedUrl: string;
}

interface StoreSettings {
  name: string;
  tagline: string;
  aboutText: string;
  announcementBar: string;
  shippingPromise: string;
  returnPolicy: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  tiktokUrl: string;
  themePreset: string;
  // Video banner settings
  videoBanner?: VideoBannerSettings;
  // Content settings
  content?: {
    shipping?: {
      methods: ShippingMethod[];
      freeShippingThreshold: string;
      processingTime: string;
      internationalNote: string;
    };
    returns?: {
      policyDays: number;
      conditions: string[];
      process: string[];
      exchangeNote: string;
    };
    faq?: FAQItem[];
  };
}

export default function SettingsPage() {
  const flags = useFeatureFlags();
  const [settings, setSettings] = useState<StoreSettings>({
    name: "",
    tagline: "",
    aboutText: "",
    announcementBar: "",
    shippingPromise: "Free shipping on orders over $50",
    returnPolicy: "30-day easy returns",
    instagramUrl: "",
    facebookUrl: "",
    twitterUrl: "",
    tiktokUrl: "",
    themePreset: "default",
    videoBanner: {
      enabled: false,
      type: "youtube",
      youtubeUrl: "",
      uploadedUrl: "",
    },
    content: {
      shipping: defaultContent.shipping,
      returns: defaultContent.returns,
      faq: defaultContent.faq,
    },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "appearance" | "domain" | "shipping" | "returns" | "faq" | "social" | "guides">("general");

  // Domain-specific state
  const [domainLoading, setDomainLoading] = useState(true);
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainData, setDomainData] = useState<{
    subdomain: string;
    subdomainUrl: string;
    customDomain: string | null;
    status: "none" | "pending" | "configured" | "error";
    message?: string;
  } | null>(null);
  const [customDomainInput, setCustomDomainInput] = useState("");

  // Load domain configuration
  useEffect(() => {
    const loadDomain = async () => {
      if (activeTab !== "domain" || !flags.customDomainEnabled) return;

      setDomainLoading(true);
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch("/api/admin/domain", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDomainData(data);
          setCustomDomainInput(data.customDomain || "");
        }
      } catch (err) {
        console.error("Failed to load domain config:", err);
      }
      setDomainLoading(false);
    };
    loadDomain();
  }, [activeTab, flags.customDomainEnabled]);

  // Save custom domain
  const handleSaveDomain = async () => {
    setDomainSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/domain", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customDomain: customDomainInput.trim() || null }),
      });

      const data = await res.json();

      if (res.ok) {
        setDomainData((prev) =>
          prev
            ? {
                ...prev,
                customDomain: customDomainInput.trim() || null,
                status: customDomainInput.trim() ? "pending" : "none",
                message: data.message,
              }
            : null
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || "Failed to save domain");
      }
    } catch (err) {
      console.error("Failed to save domain:", err);
      setError("Failed to save domain. Please try again.");
    }
    setDomainSaving(false);
  };

  // Remove custom domain
  const handleRemoveDomain = async () => {
    setDomainSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/domain", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDomainData((prev) =>
          prev ? { ...prev, customDomain: null, status: "none", message: undefined } : null
        );
        setCustomDomainInput("");
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to remove domain");
      }
    } catch (err) {
      console.error("Failed to remove domain:", err);
      setError("Failed to remove domain. Please try again.");
    }
    setDomainSaving(false);
  };

  // Load current settings from environment
  useEffect(() => {
    // These would normally come from an API, but for now we read from the store config
    // which uses environment variables
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch("/api/admin/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Merge with defaults to ensure content structure exists
          setSettings(prev => ({
            ...prev,
            ...data.settings,
            themePreset: data.settings?.themePreset || "default",
            videoBanner: {
              enabled: data.settings?.videoBanner?.enabled ?? false,
              type: data.settings?.videoBanner?.type || "youtube",
              youtubeUrl: data.settings?.videoBanner?.youtubeUrl || "",
              uploadedUrl: data.settings?.videoBanner?.uploadedUrl || "",
            },
            content: {
              shipping: data.settings?.content?.shipping || defaultContent.shipping,
              returns: data.settings?.content?.returns || defaultContent.returns,
              faq: data.settings?.content?.faq || defaultContent.faq,
            },
          }));
        } else {
          const data = await res.json();
          setError(data.error || "Failed to load settings");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Failed to load settings");
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save settings. Please try again.");
    }
    setSaving(false);
  };

  const tabs = [
    { id: "general" as const, label: "General", icon: Store },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    // Domain tab only shown for Pro/Hosted tiers
    ...(flags.customDomainEnabled
      ? [{ id: "domain" as const, label: "Domain", icon: Globe }]
      : []),
    { id: "shipping" as const, label: "Shipping", icon: Truck },
    { id: "returns" as const, label: "Returns", icon: Truck },
    { id: "faq" as const, label: "FAQ", icon: HelpCircle },
    { id: "social" as const, label: "Social", icon: Users },
    { id: "guides" as const, label: "Guides", icon: BookOpen },
  ];

  // Custom domain documentation content
  const customDomainGuide = `# Custom Domain Setup Guide

## Overview
This guide will help you connect your own domain (e.g., yourbrand.com) to your store.

## Step 1: Purchase a Domain

If you don't already own a domain, purchase one from a registrar:
- **Namecheap** - Great value and easy DNS management
- **Cloudflare** - Competitive pricing with free CDN
- **Google Domains** - Simple interface (now Squarespace)
- **GoDaddy** - Popular but often more expensive

## Step 2: Configure DNS Records

Log into your domain registrar and add the following DNS records:

### Option A: CNAME Record (Recommended for subdomains)
| Type  | Host | Value                  | TTL  |
|-------|------|------------------------|------|
| CNAME | www  | cname.vercel-dns.com   | 3600 |

### Option B: A Records (For root/apex domains)
| Type | Host | Value       | TTL  |
|------|------|-------------|------|
| A    | @    | 76.76.21.21 | 3600 |

**Note:** DNS changes can take up to 48 hours to propagate globally.

## Step 3: Add Domain to Vercel (Self-Hosted Stores)

If you downloaded and self-host your store:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Domains**
3. Click **Add Domain**
4. Enter your domain name
5. Follow the verification steps
6. Wait for SSL certificate (usually 5-10 minutes)

## Step 4: Update Environment Variables

After adding your domain, update your environment variables:

\`\`\`
NEXT_PUBLIC_APP_URL=https://yourdomain.com
\`\`\`

Then redeploy your store for changes to take effect.

## For Platform-Hosted Stores (Pro/Hosted Tier)

If your store is hosted on GoSovereign's platform:

1. Set up your DNS records as shown in Step 2
2. Contact info@gosovereign.io with:
   - Your store subdomain (e.g., yourstore.gosovereign.io)
   - Your custom domain (e.g., yourdomain.com)
3. We'll configure Vercel on our end
4. SSL will be automatically provisioned

## Troubleshooting

### SSL Certificate Not Working
- DNS changes can take up to 48 hours
- Verify your DNS records with: \`dig yourdomain.com\`
- Check for CAA records that might block Let's Encrypt

### Domain Shows Old Site
- Clear your browser cache
- Try incognito/private browsing mode
- Check TTL values (lower TTL = faster propagation)

### Redirect Issues (www vs non-www)
- Add both domains in Vercel settings
- Configure redirect in Vercel: Settings > Domains > Edit

## Need Help?

Contact info@gosovereign.io for assistance with custom domain setup.
`;

  const handleDownloadGuide = () => {
    const blob = new Blob([customDomainGuide], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "custom-domain-setup.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper functions for content editing
  const updateShippingMethod = (index: number, field: keyof ShippingMethod, value: string) => {
    const methods = [...(settings.content?.shipping?.methods || [])];
    methods[index] = { ...methods[index], [field]: value };
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        shipping: { ...settings.content?.shipping!, methods },
      },
    });
  };

  const addShippingMethod = () => {
    const methods = [...(settings.content?.shipping?.methods || [])];
    methods.push({ name: "", timeframe: "", cost: "" });
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        shipping: { ...settings.content?.shipping!, methods },
      },
    });
  };

  const removeShippingMethod = (index: number) => {
    const methods = [...(settings.content?.shipping?.methods || [])];
    methods.splice(index, 1);
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        shipping: { ...settings.content?.shipping!, methods },
      },
    });
  };

  const updateReturnCondition = (index: number, value: string) => {
    const conditions = [...(settings.content?.returns?.conditions || [])];
    conditions[index] = value;
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        returns: { ...settings.content?.returns!, conditions },
      },
    });
  };

  const addReturnCondition = () => {
    const conditions = [...(settings.content?.returns?.conditions || [])];
    conditions.push("");
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        returns: { ...settings.content?.returns!, conditions },
      },
    });
  };

  const removeReturnCondition = (index: number) => {
    const conditions = [...(settings.content?.returns?.conditions || [])];
    conditions.splice(index, 1);
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        returns: { ...settings.content?.returns!, conditions },
      },
    });
  };

  const updateReturnProcess = (index: number, value: string) => {
    const process = [...(settings.content?.returns?.process || [])];
    process[index] = value;
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        returns: { ...settings.content?.returns!, process },
      },
    });
  };

  const addReturnProcess = () => {
    const process = [...(settings.content?.returns?.process || [])];
    process.push("");
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        returns: { ...settings.content?.returns!, process },
      },
    });
  };

  const removeReturnProcess = (index: number) => {
    const process = [...(settings.content?.returns?.process || [])];
    process.splice(index, 1);
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        returns: { ...settings.content?.returns!, process },
      },
    });
  };

  const updateFAQ = (index: number, field: keyof FAQItem, value: string) => {
    const faq = [...(settings.content?.faq || [])];
    faq[index] = { ...faq[index], [field]: value };
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        faq,
      },
    });
  };

  const addFAQ = () => {
    const faq = [...(settings.content?.faq || [])];
    faq.push({ question: "", answer: "" });
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        faq,
      },
    });
  };

  const removeFAQ = (index: number) => {
    const faq = [...(settings.content?.faq || [])];
    faq.splice(index, 1);
    setSettings({
      ...settings,
      content: {
        ...settings.content,
        faq,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
            <p className="text-gray-500">Customize your store appearance and policies</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {saving ? "Saving..." : "Save Changes"}
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Name
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="My Awesome Store"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Your one-liner that captures your brand"
            />
            <p className="mt-1 text-sm text-gray-500">
              Displayed below your store name on the homepage
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About Text
            </label>
            <textarea
              value={settings.aboutText}
              onChange={(e) => setSettings({ ...settings, aboutText: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Tell customers about your store..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Displayed in the footer
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Announcement Bar
              </div>
            </label>
            <input
              type="text"
              value={settings.announcementBar}
              onChange={(e) => setSettings({ ...settings, announcementBar: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Free shipping on orders over $50!"
            />
            <p className="mt-1 text-sm text-gray-500">
              Displayed at the top of your store. Leave empty to hide.
            </p>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900">Store Theme</h3>
                <p className="text-sm text-gray-500">Choose a color scheme for your storefront</p>
              </div>
              {!flags.premiumThemesEnabled && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  <Lock className="w-3 h-3" />
                  Pro Feature
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allThemes.map((theme) => {
                const isSelected = settings.themePreset === theme.id;
                const isLocked = theme.isPremium && !flags.premiumThemesEnabled;

                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      if (!isLocked) {
                        setSettings({ ...settings, themePreset: theme.id });
                      }
                    }}
                    disabled={isLocked}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-brand bg-brand/5"
                        : isLocked
                        ? "border-gray-200 opacity-60 cursor-not-allowed"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Theme preview */}
                    <div className="flex gap-1.5 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm"
                        style={{ backgroundColor: theme.preview.primary }}
                      />
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm"
                        style={{ backgroundColor: theme.preview.accent }}
                      />
                      <div
                        className="w-8 h-8 rounded-lg border border-gray-200"
                        style={{ backgroundColor: theme.preview.background }}
                      />
                    </div>

                    {/* Theme info */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{theme.name}</span>
                      {isLocked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                      {isSelected && <Check className="w-4 h-4 text-brand" />}
                    </div>
                    <p className="text-xs text-gray-500">{theme.description}</p>

                    {/* Premium badge */}
                    {theme.isPremium && !isLocked && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full">
                        <Sparkles className="w-3 h-3" />
                        Pro
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {!flags.premiumThemesEnabled && (
              <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Upgrade to Pro for Premium Themes</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Unlock 5 additional designer themes to make your store stand out.
                    </p>
                    <a
                      href="https://gosovereign.io/wizard/preview"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Upgrade Now
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-1">Theme Preview</h4>
            <p className="text-sm text-blue-700">
              After saving, the selected theme will be applied to your storefront.
              Visit your store to see the changes in action.
            </p>
          </div>

          {/* Video Banner Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Video Banner</h3>
                  <p className="text-sm text-gray-500">Add a video banner below the header</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.videoBanner?.enabled || false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      videoBanner: {
                        ...settings.videoBanner!,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <span className="text-sm font-medium text-gray-700">Enable</span>
              </label>
            </div>

            {settings.videoBanner?.enabled && (
              <div className="space-y-6">
                {/* Video Source Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Video Source
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          videoBanner: { ...settings.videoBanner!, type: "youtube" },
                        })
                      }
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                        settings.videoBanner?.type === "youtube"
                          ? "border-brand bg-brand/5 text-brand"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Youtube className="w-5 h-5" />
                      YouTube URL
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          videoBanner: { ...settings.videoBanner!, type: "upload" },
                        })
                      }
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                        settings.videoBanner?.type === "upload"
                          ? "border-brand bg-brand/5 text-brand"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Upload className="w-5 h-5" />
                      Upload Video
                    </button>
                  </div>
                </div>

                {/* YouTube URL Input */}
                {settings.videoBanner?.type === "youtube" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={settings.videoBanner?.youtubeUrl || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          videoBanner: { ...settings.videoBanner!, youtubeUrl: e.target.value },
                        })
                      }
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                    />
                    <p className="mt-1.5 text-sm text-gray-500">
                      Supports youtube.com/watch, youtu.be, and youtube.com/shorts URLs
                    </p>
                  </div>
                )}

                {/* Video Upload */}
                {settings.videoBanner?.type === "upload" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Video
                    </label>
                    <VideoUpload
                      value={settings.videoBanner?.uploadedUrl || ""}
                      onChange={(url) =>
                        setSettings({
                          ...settings,
                          videoBanner: { ...settings.videoBanner!, uploadedUrl: url },
                        })
                      }
                    />
                  </div>
                )}

                {/* Recommendation Note */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Video className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-900">Recommendation</p>
                      <p className="text-sm text-purple-700 mt-1">
                        Use short clips (5-10 seconds) for best performance. Videos will autoplay
                        muted and loop continuously below your header.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Domain Tab (Pro/Hosted only) */}
      {activeTab === "domain" && flags.customDomainEnabled && (
        <div className="space-y-6">
          {/* Current Domain Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Domain Settings</h3>
                <p className="text-sm text-gray-500">Connect a custom domain to your store</p>
              </div>
            </div>

            {domainLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Subdomain */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Store URL
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-mono text-sm">
                      {domainData?.subdomainUrl || "Loading..."}
                    </div>
                    <a
                      href={domainData?.subdomainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-brand transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                {/* Custom Domain Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Domain
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value.toLowerCase())}
                      placeholder="shop.yourdomain.com"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-mono text-sm"
                    />
                    <button
                      onClick={handleSaveDomain}
                      disabled={domainSaving || customDomainInput === (domainData?.customDomain || "")}
                      className="px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                    >
                      {domainSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : saved ? (
                        <>
                          <Check className="w-4 h-4" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Enter your domain without https:// (e.g., shop.example.com or example.com)
                  </p>
                </div>

                {/* Domain Status */}
                {domainData?.customDomain && (
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium text-amber-900">
                          {domainData.customDomain}
                        </p>
                        <p className="text-sm text-amber-700">
                          {domainData.message || "Pending configuration"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveDomain}
                      disabled={domainSaving}
                      className="p-2 text-amber-600 hover:text-red-600 transition-colors"
                      title="Remove custom domain"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DNS Instructions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">DNS Configuration</h4>
            <p className="text-sm text-gray-600 mb-4">
              Add the following DNS records at your domain registrar:
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-4">
              <div className="mb-2 text-gray-400"># For subdomains (www, shop, etc.) - CNAME Record</div>
              <div className="mb-3">
                <span className="text-green-400">Type:</span> CNAME &nbsp;
                <span className="text-green-400">Host:</span> www &nbsp;
                <span className="text-green-400">Value:</span> cname.vercel-dns.com
              </div>
              <div className="mb-2 text-gray-400"># For root/apex domain (@) - A Record</div>
              <div>
                <span className="text-green-400">Type:</span> A &nbsp;
                <span className="text-green-400">Host:</span> @ &nbsp;
                <span className="text-green-400">Value:</span> 76.76.21.21
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-600">
              <HelpCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p>
                DNS changes can take up to 48 hours to propagate. After configuring your DNS,
                contact <a href="mailto:info@gosovereign.io" className="text-brand hover:underline">info@gosovereign.io</a> to
                complete the domain setup.
              </p>
            </div>
          </div>

          {/* Download Guide */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Need more detailed instructions?</span>
            </div>
            <button
              onClick={handleDownloadGuide}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download Guide
            </button>
          </div>
        </div>
      )}

      {/* Shipping Tab */}
      {activeTab === "shipping" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Shipping Methods
              </label>
              <button
                onClick={addShippingMethod}
                className="flex items-center gap-1 text-sm text-brand hover:underline"
              >
                <Plus className="w-4 h-4" />
                Add Method
              </button>
            </div>
            <div className="space-y-3">
              {(settings.content?.shipping?.methods || []).map((method, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={method.name}
                      onChange={(e) => updateShippingMethod(index, "name", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="Method name"
                    />
                    <input
                      type="text"
                      value={method.timeframe}
                      onChange={(e) => updateShippingMethod(index, "timeframe", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="5-7 days"
                    />
                    <input
                      type="text"
                      value={method.cost}
                      onChange={(e) => updateShippingMethod(index, "cost", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="$5.99"
                    />
                  </div>
                  <button
                    onClick={() => removeShippingMethod(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Free Shipping Threshold
            </label>
            <input
              type="text"
              value={settings.content?.shipping?.freeShippingThreshold || ""}
              onChange={(e) => setSettings({
                ...settings,
                content: {
                  ...settings.content,
                  shipping: { ...settings.content?.shipping!, freeShippingThreshold: e.target.value },
                },
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="$50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Processing Time
            </label>
            <input
              type="text"
              value={settings.content?.shipping?.processingTime || ""}
              onChange={(e) => setSettings({
                ...settings,
                content: {
                  ...settings.content,
                  shipping: { ...settings.content?.shipping!, processingTime: e.target.value },
                },
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="1-2 business days"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              International Shipping Note
            </label>
            <textarea
              value={settings.content?.shipping?.internationalNote || ""}
              onChange={(e) => setSettings({
                ...settings,
                content: {
                  ...settings.content,
                  shipping: { ...settings.content?.shipping!, internationalNote: e.target.value },
                },
              })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Contact us for international shipping rates..."
            />
          </div>
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === "returns" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Return Policy (Days)
            </label>
            <input
              type="number"
              value={settings.content?.returns?.policyDays || 30}
              onChange={(e) => setSettings({
                ...settings,
                content: {
                  ...settings.content,
                  returns: { ...settings.content?.returns!, policyDays: parseInt(e.target.value) || 30 },
                },
              })}
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              min={0}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Return Conditions
              </label>
              <button
                onClick={addReturnCondition}
                className="flex items-center gap-1 text-sm text-brand hover:underline"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </button>
            </div>
            <div className="space-y-2">
              {(settings.content?.returns?.conditions || []).map((condition, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => updateReturnCondition(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Condition..."
                  />
                  <button
                    onClick={() => removeReturnCondition(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Return Process Steps
              </label>
              <button
                onClick={addReturnProcess}
                className="flex items-center gap-1 text-sm text-brand hover:underline"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            </div>
            <div className="space-y-2">
              {(settings.content?.returns?.process || []).map((step, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => updateReturnProcess(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Step..."
                  />
                  <button
                    onClick={() => removeReturnProcess(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exchange Note
            </label>
            <textarea
              value={settings.content?.returns?.exchangeNote || ""}
              onChange={(e) => setSettings({
                ...settings,
                content: {
                  ...settings.content,
                  returns: { ...settings.content?.returns!, exchangeNote: e.target.value },
                },
              })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Information about exchanges..."
            />
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Frequently Asked Questions</h3>
              <p className="text-sm text-gray-500">Add questions and answers for your FAQ page</p>
            </div>
            <button
              onClick={addFAQ}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>

          <div className="space-y-4">
            {(settings.content?.faq || []).map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => updateFAQ(index, "question", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="Question..."
                    />
                    <textarea
                      value={item.answer}
                      onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="Answer..."
                    />
                  </div>
                  <button
                    onClick={() => removeFAQ(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {(!settings.content?.faq || settings.content.faq.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No FAQ items yet. Click "Add Question" to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Links Tab */}
      {activeTab === "social" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram URL
            </label>
            <input
              type="url"
              value={settings.instagramUrl}
              onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="https://instagram.com/yourstore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook URL
            </label>
            <input
              type="url"
              value={settings.facebookUrl}
              onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="https://facebook.com/yourstore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter/X URL
            </label>
            <input
              type="url"
              value={settings.twitterUrl}
              onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="https://twitter.com/yourstore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TikTok URL
            </label>
            <input
              type="url"
              value={settings.tiktokUrl}
              onChange={(e) => setSettings({ ...settings, tiktokUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="https://tiktok.com/@yourstore"
            />
          </div>

          <p className="text-sm text-gray-500">
            Social links will appear in the footer and mobile menu.
          </p>
        </div>
      )}

      {/* Guides Tab */}
      {activeTab === "guides" && (
        <div className="space-y-6">
          {/* Custom Domain Guide */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Globe className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Custom Domain Setup</h3>
                  <p className="text-sm text-gray-500">Connect your own domain to your store</p>
                </div>
              </div>
              <button
                onClick={handleDownloadGuide}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Guide
              </button>
            </div>

            <div className="prose prose-sm max-w-none">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Start</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Purchase a domain from a registrar (Namecheap, Cloudflare, etc.)</li>
                  <li>Add DNS records pointing to Vercel</li>
                  <li>Configure the domain in your hosting dashboard</li>
                  <li>Update your store&apos;s environment variables</li>
                </ol>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">DNS Configuration</h4>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  <div className="mb-2 text-gray-400"># For www subdomain (CNAME)</div>
                  <div>www  CNAME  cname.vercel-dns.com</div>
                  <div className="mt-3 mb-2 text-gray-400"># For root domain (A Record)</div>
                  <div>@    A      76.76.21.21</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Platform-Hosted Stores</h4>
                <p className="text-sm text-gray-600 mb-3">
                  If your store is hosted on GoSovereign&apos;s platform, we&apos;ll handle the Vercel configuration for you.
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href="mailto:info@gosovereign.io?subject=Custom Domain Setup Request"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                  >
                    Contact Support
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* More Guides Coming Soon */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-6 text-center">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">More guides coming soon</p>
            <p className="text-sm text-gray-400 mt-1">Analytics setup, SEO optimization, and more</p>
          </div>
        </div>
      )}

      {/* Note about environment variables */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-medium text-amber-900 mb-1">Note</h4>
        <p className="text-sm text-amber-700">
          Settings changes require a redeployment to take effect. After saving, you'll need to
          redeploy your store through GoSovereign for changes to appear.
        </p>
      </div>
    </div>
  );
}
