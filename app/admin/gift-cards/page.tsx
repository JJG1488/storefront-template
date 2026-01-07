"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Gift, Mail, Calendar, Eye, Ban } from "lucide-react";

interface GiftCard {
  id: string;
  code: string;
  original_amount: number;
  current_balance: number;
  purchased_by_email: string;
  purchased_by_name: string | null;
  recipient_email: string;
  recipient_name: string | null;
  status: "active" | "disabled" | "exhausted";
  purchased_at: string;
  last_used_at: string | null;
  email_sent_at: string | null;
}

function getGiftCardStatus(giftCard: GiftCard): { label: string; color: string } {
  if (giftCard.status === "disabled") {
    return { label: "Disabled", color: "bg-red-100 text-red-700" };
  }
  if (giftCard.status === "exhausted" || giftCard.current_balance === 0) {
    return { label: "Exhausted", color: "bg-gray-100 text-gray-700" };
  }
  return { label: "Active", color: "bg-green-100 text-green-700" };
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminGiftCardsPage() {
  const router = useRouter();
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/gift-cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGiftCards(data.giftCards || []);
      }
    } catch (err) {
      console.error("Failed to fetch gift cards:", err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gift Cards</h1>
          <p className="text-gray-500">Manage gift cards for your store</p>
        </div>
        <Link
          href="/admin/gift-cards/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors"
        >
          <Plus className="w-4 h-4" />
          Issue Gift Card
        </Link>
      </div>

      {/* Gift Cards List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : giftCards.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No gift cards yet</h3>
            <p className="text-gray-500 mb-4">
              Gift cards will appear here when customers purchase them or you issue them manually.
            </p>
            <Link
              href="/admin/gift-cards/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover active:bg-brand-active transition-colors"
            >
              <Plus className="w-4 h-4" />
              Issue Gift Card
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
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Recipient</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Purchased</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {giftCards.map((giftCard) => {
                    const status = getGiftCardStatus(giftCard);
                    return (
                      <tr
                        key={giftCard.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/admin/gift-cards/${giftCard.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Gift className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-mono font-semibold text-gray-900">{giftCard.code}</p>
                              <p className="text-sm text-gray-500">
                                Original: {formatCurrency(giftCard.original_amount)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">
                            {giftCard.recipient_name || giftCard.recipient_email}
                          </p>
                          {giftCard.recipient_name && (
                            <p className="text-sm text-gray-500">{giftCard.recipient_email}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(giftCard.current_balance)}
                          </p>
                          {giftCard.current_balance < giftCard.original_amount && (
                            <p className="text-sm text-gray-500">
                              {formatCurrency(giftCard.original_amount - giftCard.current_balance)} used
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {new Date(giftCard.purchased_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/admin/gift-cards/${giftCard.id}`}
                              className="p-2 text-gray-500 hover:text-brand transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
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
              {giftCards.map((giftCard) => {
                const status = getGiftCardStatus(giftCard);
                return (
                  <div
                    key={giftCard.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/gift-cards/${giftCard.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Gift className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-mono font-semibold text-gray-900">{giftCard.code}</p>
                          <p className="text-sm font-medium text-purple-600">
                            {formatCurrency(giftCard.current_balance)} remaining
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">{giftCard.recipient_email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(giftCard.purchased_at).toLocaleDateString()}</span>
                      </div>
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
