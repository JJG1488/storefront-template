"use client";

import { useState, useEffect } from "react";
import { Star, Quote, Shield, ChevronLeft, ChevronRight } from "lucide-react";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified: boolean;
  created_at: string;
}

export function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch("/api/reviews/featured");
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
        }
      } catch (error) {
        console.error("Failed to load testimonials:", error);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  // Don't render if no reviews
  if (loading) {
    return (
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  const visibleReviews = reviews.slice(0, 6);
  const showCarousel = reviews.length > 3;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(visibleReviews.length / 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(visibleReviews.length / 3)) % Math.ceil(visibleReviews.length / 3));
  };

  const displayedReviews = showCarousel
    ? visibleReviews.slice(currentIndex * 3, currentIndex * 3 + 3)
    : visibleReviews;

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Real reviews from real customers who love shopping with us.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="relative">
          {showCarousel && (
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Previous reviews"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-brand/20 mb-4" />

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {/* Title */}
                {review.title && (
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {review.title}
                  </h4>
                )}

                {/* Body */}
                {review.body && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-4">
                    {review.body}
                  </p>
                )}

                {/* Author */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {review.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {review.author_name}
                      </p>
                      {review.is_verified && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Verified Purchase
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showCarousel && (
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Next reviews"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Carousel Dots */}
        {showCarousel && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(visibleReviews.length / 3) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? "bg-brand" : "bg-gray-300"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
