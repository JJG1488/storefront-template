"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Heart } from "lucide-react";
import { CartIcon } from "./CartIcon";
import { getStoreConfig } from "@/lib/store";
import { MobileMenu, MenuButton } from "./MobileMenu";
import { SearchModal } from "./SearchModal";

export function Header() {
  const store = getStoreConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Handle keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Announcement Bar */}
      {store.announcementBar && (
        <div className="bg-brand text-white text-center py-2 px-4 text-sm">
          {store.announcementBar}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Mobile/Tablet: 3-column grid */}
          <div className="grid grid-cols-3 items-center lg:hidden">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-2">
              <MenuButton
                onClick={() => setMobileMenuOpen(true)}
                isOpen={mobileMenuOpen}
              />
              {store.logoUrl && (
                <Link href="/" className="flex items-center">
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="h-8 object-contain rounded-lg"
                  />
                </Link>
              )}
            </div>

            {/* Center: Store Name */}
            <Link
              href="/"
              className="justify-self-center text-base sm:text-lg font-bold text-gray-900 hover:text-gray-700 transition-colors truncate max-w-full text-center"
            >
              {store.name}
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <CartIcon />
            </div>
          </div>

          {/* Desktop: Full navigation */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-3">
              {store.logoUrl && (
                <Link href="/" className="flex items-center">
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="h-10 object-contain rounded-lg"
                  />
                </Link>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                href="/#products"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Products
              </Link>
              <Link
                href="/contact"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Contact
              </Link>
            </nav>

            {/* Center: Store Name */}
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              {store.name}
            </Link>

            {/* Search Bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors min-w-[200px]"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search...</span>
              <span className="ml-auto text-xs text-gray-400 border border-gray-300 rounded px-1.5 py-0.5">
                ⌘K
              </span>
            </button>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              <Link
                href="/wishlist"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>
              <CartIcon />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onSearchClick={() => setSearchOpen(true)}
      />

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
