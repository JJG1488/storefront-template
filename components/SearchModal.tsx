"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, X, Clock, TrendingUp, ArrowRight } from "lucide-react";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = "store_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    }
  }, []);

  // Focus management - store trigger element and restore focus on close
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element before opening
      previousActiveElement.current = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      // Restore focus to the element that opened the modal
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
        previousActiveElement.current = null;
      }
    }
  }, [isOpen]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data.products || []);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchProducts(value);
    }, 300);
  };

  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleResultClick = () => {
    saveRecentSearch(query);
    onClose();
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    searchProducts(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative max-w-2xl mx-auto mt-20 mx-4">
        <div className="bg-[var(--bg-primary)] rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center border-b border-[var(--border-color)] px-4">
            <Search className="w-5 h-5 text-[var(--text-muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-4 py-4 text-lg focus:outline-none bg-transparent text-[var(--text-primary)]"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
                className="p-1 hover:bg-[var(--bg-secondary)] rounded-full"
                aria-label="Clear search"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-2 px-3 py-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              aria-label="Close search (Escape)"
            >
              ESC
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* Loading */}
            {loading && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <div className="p-4">
                <p className="text-sm text-[var(--text-muted)] mb-3">
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-2">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-lg overflow-hidden flex-shrink-0">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                            <Search className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[var(--text-primary)] truncate group-hover:text-brand transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-sm text-[var(--text-muted)] truncate">
                          {product.description}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-semibold text-[var(--text-primary)]">
                          {formatPrice(product.price)}
                        </p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && query && results.length === 0 && (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-muted)]">No products found for "{query}"</p>
              </div>
            )}

            {/* Recent Searches & Suggestions (when no query) */}
            {!loading && !query && (
              <div className="p-4">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Recent Searches
                      </h3>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(search)}
                          className="px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full text-sm hover:opacity-80 transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular/Trending */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4" />
                    Popular Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {["New arrivals", "Best sellers", "Sale", "Featured"].map(
                      (term) => (
                        <button
                          key={term}
                          onClick={() => handleRecentSearchClick(term)}
                          className="px-3 py-1.5 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-full text-sm hover:border-brand hover:text-brand transition-colors"
                        >
                          {term}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Search button/trigger component
interface SearchButtonProps {
  onClick: () => void;
  variant?: "icon" | "bar";
}

export function SearchButton({ onClick, variant = "icon" }: SearchButtonProps) {
  if (variant === "bar") {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 w-full max-w-md px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded-lg hover:opacity-80 transition-colors"
      >
        <Search className="w-5 h-5" />
        <span>Search products...</span>
        <span className="ml-auto text-xs text-[var(--text-muted)] hidden sm:block">⌘K</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
      aria-label="Search"
    >
      <Search className="w-5 h-5" />
    </button>
  );
}
