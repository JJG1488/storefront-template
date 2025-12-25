"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Store, Megaphone, Truck, Users, Palette, Check } from "lucide-react";

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
}

export default function SettingsPage() {
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
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "shipping" | "social">("general");

  // Load current settings from environment
  useEffect(() => {
    // These would normally come from an API, but for now we read from the store config
    // which uses environment variables
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
    setSaving(false);
  };

  const tabs = [
    { id: "general" as const, label: "General", icon: Store },
    { id: "shipping" as const, label: "Shipping & Returns", icon: Truck },
    { id: "social" as const, label: "Social Links", icon: Users },
  ];

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

      {/* Shipping & Returns Tab */}
      {activeTab === "shipping" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Promise
            </label>
            <input
              type="text"
              value={settings.shippingPromise}
              onChange={(e) => setSettings({ ...settings, shippingPromise: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Free shipping on orders over $50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Displayed in trust badges on the homepage
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Return Policy
            </label>
            <input
              type="text"
              value={settings.returnPolicy}
              onChange={(e) => setSettings({ ...settings, returnPolicy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="30-day easy returns"
            />
            <p className="mt-1 text-sm text-gray-500">
              Displayed in trust badges on the homepage
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <Truck className="w-4 h-4" />
                {settings.shippingPromise || "Free shipping on orders over $50"}
              </div>
            </div>
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
