"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { useCustomerAuth } from "@/components/CustomerAuthContext";

interface Profile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  acceptsMarketing: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshCustomer } = useCustomerAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    acceptsMarketing: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/account/login?redirect=/account/profile");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("customer_token");
      if (!token) return;

      try {
        const res = await fetch("/api/customer/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setFormData({
            firstName: data.profile.firstName || "",
            lastName: data.profile.lastName || "",
            phone: data.profile.phone || "",
            acceptsMarketing: data.profile.acceptsMarketing || false,
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaved(false);

    const token = localStorage.getItem("customer_token");
    if (!token) {
      setError("Please log in again");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile(data.profile);
        setSaved(true);
        await refreshCustomer();
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Account
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Update your personal information</p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="John"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Doe"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* Marketing */}
          <div className="flex items-start gap-3 pt-2">
            <input
              id="marketing"
              type="checkbox"
              checked={formData.acceptsMarketing}
              onChange={(e) =>
                setFormData({ ...formData, acceptsMarketing: e.target.checked })
              }
              className="mt-1 w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
            />
            <label htmlFor="marketing" className="text-sm text-gray-600">
              Receive news, exclusive offers, and updates via email. You can
              unsubscribe at any time.
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {saved && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-600">Profile updated successfully!</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-brand text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold text-gray-900 mb-2">Account Information</h2>
        <p className="text-sm text-gray-600">
          Member since{" "}
          {new Date(profile.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Change Password Link */}
      <div className="mt-6 text-center">
        <Link
          href="/account/forgot-password"
          className="text-brand font-medium hover:underline"
        >
          Change Password
        </Link>
      </div>
    </div>
  );
}
