"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Percent, DollarSign, Calendar, Users, Trash2, Edit } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

function getCouponStatus(coupon: Coupon): { label: string; color: string } {
  if (!coupon.is_active) {
    return { label: "Inactive", color: "bg-gray-100 text-gray-700" };
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { label: "Expired", color: "bg-red-100 text-red-700" };
  }
  if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
    return { label: "Scheduled", color: "bg-blue-100 text-blue-700" };
  }
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
    return { label: "Depleted", color: "bg-amber-100 text-amber-700" };
  }
  return { label: "Active", color: "bg-green-100 text-green-700" };
}

function formatDiscount(coupon: Coupon): string {
  if (coupon.discount_type === "percentage") {
    return `${coupon.discount_value}% off`;
  }
  return `$${(coupon.discount_value / 100).toFixed(2)} off`;
}

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/coupons", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    setDeleting(id);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCoupons(coupons.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete coupon:", err);
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-500">Create and manage discount codes for your store</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </Link>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <Percent className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons yet</h3>
            <p className="text-gray-500 mb-4">Create your first coupon to offer discounts to customers</p>
            <Link
              href="/admin/coupons/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Coupon
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Usage</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <tr
                        key={coupon.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/admin/coupons/${coupon.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand/10 rounded-lg">
                              {coupon.discount_type === "percentage" ? (
                                <Percent className="w-4 h-4 text-brand" />
                              ) : (
                                <DollarSign className="w-4 h-4 text-brand" />
                              )}
                            </div>
                            <div>
                              <p className="font-mono font-semibold text-gray-900">{coupon.code}</p>
                              {coupon.description && (
                                <p className="text-sm text-gray-500 truncate max-w-xs">{coupon.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{formatDiscount(coupon)}</p>
                          {coupon.minimum_order_amount > 0 && (
                            <p className="text-sm text-gray-500">
                              Min: ${(coupon.minimum_order_amount / 100).toFixed(2)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>
                              {coupon.current_uses}
                              {coupon.max_uses !== null && ` / ${coupon.max_uses}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/admin/coupons/${coupon.id}`}
                              className="p-2 text-gray-500 hover:text-brand transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(coupon.id)}
                              disabled={deleting === coupon.id}
                              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                            >
                              {deleting === coupon.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <div
                    key={coupon.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/coupons/${coupon.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand/10 rounded-lg">
                          {coupon.discount_type === "percentage" ? (
                            <Percent className="w-4 h-4 text-brand" />
                          ) : (
                            <DollarSign className="w-4 h-4 text-brand" />
                          )}
                        </div>
                        <div>
                          <p className="font-mono font-semibold text-gray-900">{coupon.code}</p>
                          <p className="text-sm font-medium text-brand">{formatDiscount(coupon)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    {coupon.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{coupon.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {coupon.current_uses}
                          {coupon.max_uses !== null && ` / ${coupon.max_uses}`} uses
                        </span>
                      </div>
                      {coupon.expires_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Expires {new Date(coupon.expires_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
