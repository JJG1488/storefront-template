"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Store, Megaphone, Truck, Users, Check, HelpCircle, Plus, Trash2, GripVertical } from "lucide-react";
import { defaultContent, type ShippingMethod, type FAQItem } from "@/lib/content";

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
    content: {
      shipping: defaultContent.shipping,
      returns: defaultContent.returns,
      faq: defaultContent.faq,
    },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "shipping" | "returns" | "faq" | "social">("general");

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
          setSettings(data.settings);
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
    { id: "shipping" as const, label: "Shipping", icon: Truck },
    { id: "returns" as const, label: "Returns", icon: Truck },
    { id: "faq" as const, label: "FAQ", icon: HelpCircle },
    { id: "social" as const, label: "Social", icon: Users },
  ];

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
              {settings.content?.shipping?.methods.map((method, index) => (
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
              {settings.content?.returns?.conditions.map((condition, index) => (
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
              {settings.content?.returns?.process.map((step, index) => (
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
            {settings.content?.faq?.map((item, index) => (
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
