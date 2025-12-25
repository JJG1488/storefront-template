"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface ProductTabsProps {
  description: string;
  specifications?: Record<string, string>;
  careInstructions?: string;
  reviews?: ProductReview[];
  averageRating?: number;
}

export interface ProductReview {
  id: string;
  authorName: string;
  rating: number;
  title?: string;
  body: string;
  isVerified?: boolean;
  createdAt: string;
}

type TabId = "description" | "specifications" | "care" | "reviews";

interface Tab {
  id: TabId;
  label: string;
  count?: number;
}

export function ProductTabs({
  description,
  specifications,
  careInstructions,
  reviews = [],
  averageRating,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("description");

  // Build tabs based on available content
  const tabs: Tab[] = [
    { id: "description", label: "Description" },
  ];

  if (specifications && Object.keys(specifications).length > 0) {
    tabs.push({ id: "specifications", label: "Specifications" });
  }

  if (careInstructions) {
    tabs.push({ id: "care", label: "Care" });
  }

  tabs.push({
    id: "reviews",
    label: "Reviews",
    count: reviews.length,
  });

  return (
    <div className="border-t border-gray-200">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-gray-400">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-8">
        {activeTab === "description" && (
          <div className="prose prose-gray max-w-none">
            <div
              className="text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: description.replace(/\n/g, "<br />"),
              }}
            />
          </div>
        )}

        {activeTab === "specifications" && specifications && (
          <div className="max-w-2xl">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {Object.entries(specifications).map(([key, value]) => (
                  <tr key={key}>
                    <td className="py-3 pr-4 text-sm font-medium text-gray-500 w-1/3">
                      {key}
                    </td>
                    <td className="py-3 text-sm text-gray-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "care" && careInstructions && (
          <div className="prose prose-gray max-w-none">
            <div
              className="text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: careInstructions.replace(/\n/g, "<br />"),
              }}
            />
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-8">
            {/* Reviews Summary */}
            {reviews.length > 0 && averageRating && (
              <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    <StarRating rating={averageRating} size="md" />
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Star className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No reviews yet
                </h3>
                <p className="text-gray-500">
                  Be the first to review this product
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Star Rating Component
interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export function StarRating({
  rating,
  size = "sm",
  showValue = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= rating;
        const isHalf = star === Math.ceil(rating) && !Number.isInteger(rating);

        return (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              isFilled
                ? "text-yellow-400 fill-yellow-400"
                : isHalf
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
          />
        );
      })}
      {showValue && (
        <span className="ml-1.5 text-sm text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Review Card Component
interface ReviewCardProps {
  review: ProductReview;
}

function ReviewCard({ review }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="border-b border-gray-100 pb-6 last:border-0">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} />
            {review.isVerified && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Verified Purchase
              </span>
            )}
          </div>
          {review.title && (
            <h4 className="font-medium text-gray-900 mt-2">{review.title}</h4>
          )}
        </div>
        <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
      </div>

      <p className="text-gray-600 mt-2">{review.body}</p>

      <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
          {review.authorName.charAt(0).toUpperCase()}
        </div>
        <span>{review.authorName}</span>
      </div>
    </div>
  );
}
