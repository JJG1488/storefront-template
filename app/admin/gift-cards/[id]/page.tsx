"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Gift,
  Mail,
  User,
  Calendar,
  CreditCard,
  Ban,
  CheckCircle,
  Send,
  History,
} from "lucide-react";

interface GiftCard {
  id: string;
  code: string;
  original_amount: number;
  current_balance: number;
  purchased_by_email: string;
  purchased_by_name: string | null;
  recipient_email: string;
  recipient_name: string | null;
  gift_message: string | null;
  status: "active" | "disabled" | "exhausted";
  purchased_at: string;
  last_used_at: string | null;
  email_sent_at: string | null;
  order_id: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  note: string | null;
  created_at: string;
  order_id: string | null;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getStatusBadge(giftCard: GiftCard): { label: string; color: string; icon: typeof CheckCircle } {
  if (giftCard.status === "disabled") {
    return { label: "Disabled", color: "bg-red-100 text-red-700", icon: Ban };
  }
  if (giftCard.status === "exhausted" || giftCard.current_balance === 0) {
    return { label: "Exhausted", color: "bg-gray-100 text-gray-700", icon: CreditCard };
  }
  return { label: "Active", color: "bg-green-100 text-green-700", icon: CheckCircle };
}

export default function GiftCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [giftCard, setGiftCard] = useState<GiftCard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [toggling, setToggling] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchGiftCard();
  }, [id]);

  const fetchGiftCard = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/gift-cards/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        router.push("/admin/gift-cards");
        return;
      }

      const data = await res.json();
      setGiftCard(data.giftCard);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Failed to fetch gift card:", err);
      router.push("/admin/gift-cards");
    }
    setLoading(false);
  };

  const toggleStatus = async () => {
    if (!giftCard) return;
    setToggling(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("admin_token");
      const newStatus = giftCard.status === "disabled" ? "active" : "disabled";
      const res = await fetch(`/api/admin/gift-cards/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setGiftCard(data.giftCard);
        setMessage({
          type: "success",
          text: `Gift card ${newStatus === "disabled" ? "disabled" : "enabled"} successfully.`,
        });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update status" });
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
      setMessage({ type: "error", text: "Failed to update status" });
    }
    setToggling(false);
  };

  const resendEmail = async () => {
    if (!giftCard) return;
    setResending(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/admin/gift-cards/${id}/resend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Email sent successfully!" });
        // Refresh to update email_sent_at
        fetchGiftCard();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to send email" });
      }
    } catch (err) {
      console.error("Failed to resend email:", err);
      setMessage({ type: "error", text: "Failed to send email" });
    }
    setResending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!giftCard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Gift card not found.</p>
        <Link href="/admin/gift-cards" className="text-brand hover:underline mt-2 inline-block">
          Back to Gift Cards
        </Link>
      </div>
    );
  }

  const status = getStatusBadge(giftCard);
  const StatusIcon = status.icon;
  const usedAmount = giftCard.original_amount - giftCard.current_balance;
  const usedPercentage = (usedAmount / giftCard.original_amount) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/gift-cards"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{giftCard.code}</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resendEmail}
            disabled={resending}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {resending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Resend Email
          </button>
          <button
            onClick={toggleStatus}
            disabled={toggling || giftCard.status === "exhausted"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              giftCard.status === "disabled"
                ? "text-green-700 border border-green-300 hover:bg-green-50"
                : "text-red-700 border border-red-300 hover:bg-red-50"
            }`}
          >
            {toggling ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : giftCard.status === "disabled" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Ban className="w-4 h-4" />
            )}
            {giftCard.status === "disabled" ? "Enable" : "Disable"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Balance</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Original</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(giftCard.original_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Used</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(usedAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(giftCard.current_balance)}
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${100 - usedPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">
              {usedPercentage.toFixed(0)}% used
            </p>
          </div>

          {/* Gift Message */}
          {giftCard.gift_message && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Gift Message</h2>
              <p className="text-gray-600 italic">&ldquo;{giftCard.gift_message}&rdquo;</p>
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" />
                Transaction History
              </h2>
            </div>
            {transactions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No transactions yet.</p>
                <p className="text-sm mt-1">Transactions will appear here when the gift card is used.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(tx.amount)} redeemed
                      </p>
                      <p className="text-sm text-gray-500">
                        {tx.note || "Order purchase"}
                        {tx.order_id && (
                          <Link
                            href={`/admin/orders/${tx.order_id}`}
                            className="ml-2 text-brand hover:underline"
                          >
                            View Order
                          </Link>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {formatCurrency(tx.balance_before)} → {formatCurrency(tx.balance_after)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.created_at).toLocaleDateString()}{" "}
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recipient */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recipient</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">
                  {giftCard.recipient_name || "Not specified"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{giftCard.recipient_email}</span>
              </div>
              {giftCard.email_sent_at && (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Send className="w-4 h-4" />
                  <span>
                    Email sent {new Date(giftCard.email_sent_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Purchaser */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchaser</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">
                  {giftCard.purchased_by_name || "Not specified"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{giftCard.purchased_by_email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">
                  {new Date(giftCard.purchased_at).toLocaleDateString()}
                </span>
              </div>
              {giftCard.order_id && (
                <div className="pt-2 border-t border-gray-100">
                  <Link
                    href={`/admin/orders/${giftCard.order_id}`}
                    className="text-sm text-brand hover:underline"
                  >
                    View Original Order
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {new Date(giftCard.purchased_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Used</span>
                <span className="text-gray-900">
                  {giftCard.last_used_at
                    ? new Date(giftCard.last_used_at).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
