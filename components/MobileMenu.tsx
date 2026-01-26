"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Home, ShoppingBag, FolderOpen, Search, Heart, User, ChevronRight, Instagram, Facebook, Twitter } from "lucide-react";
import { getStoreConfig } from "@/lib/store";
import type { RuntimeSettings } from "@/lib/settings";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchClick?: () => void;
  settings: RuntimeSettings;
}

export function MobileMenu({ isOpen, onClose, onSearchClick, settings }: MobileMenuProps) {
  const store = getStoreConfig();

  // Prevent body scroll when menu is open
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

  // Use runtime settings for social links
  const hasSocialLinks = settings.instagramUrl || settings.facebookUrl || settings.twitterUrl;

  const mainLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#products", label: "All Products", icon: ShoppingBag },
    { href: "/collections", label: "Collections", icon: FolderOpen },
  ];

  const secondaryLinks = [
    { href: "/contact", label: "Contact Us" },
    { href: "/shipping", label: "Shipping Info" },
    { href: "/returns", label: "Returns & Exchanges" },
    { href: "/faq", label: "FAQ" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-[var(--bg-primary)] z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
            <Link href="/" onClick={onClose} className="flex items-center gap-2">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={store.name} className="h-8" />
              ) : (
                <span className="text-lg font-bold text-[var(--text-primary)]">{store.name}</span>
              )}
            </Link>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-primary)]"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          {onSearchClick && (
            <div className="p-4 border-b border-[var(--border-light)]">
              <button
                onClick={() => {
                  onClose();
                  onSearchClick();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-lg text-[var(--text-muted)]"
              >
                <Search className="w-5 h-5" />
                <span>Search products...</span>
              </button>
            </div>
          )}

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-1">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <link.icon className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span className="font-medium text-[var(--text-primary)]">{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] ml-auto" />
                </Link>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-[var(--border-light)]">
              <h3 className="px-4 mb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Quick Actions
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onSearchClick) onSearchClick();
                  }}
                  className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-secondary)] rounded-lg hover:opacity-80 transition-colors"
                >
                  <Search className="w-6 h-6 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Search</span>
                </button>
                <Link
                  href="/wishlist"
                  onClick={onClose}
                  className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-secondary)] rounded-lg hover:opacity-80 transition-colors"
                >
                  <Heart className="w-6 h-6 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Wishlist</span>
                </Link>
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-secondary)] rounded-lg hover:opacity-80 transition-colors"
                >
                  <User className="w-6 h-6 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Account</span>
                </Link>
              </div>
            </div>

            {/* Help Links */}
            <div className="p-4 border-t border-[var(--border-light)]">
              <h3 className="px-4 mb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Help
              </h3>
              <div className="space-y-1">
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className="block px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--border-light)]">
            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex justify-center gap-4 mb-4">
                {settings.instagramUrl && (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand hover:text-white transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {settings.facebookUrl && (
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand hover:text-white transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {settings.twitterUrl && (
                  <a
                    href={settings.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand hover:text-white transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}

            <p className="text-center text-sm text-[var(--text-muted)]">
              &copy; {new Date().getFullYear()} {store.name}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Hamburger menu button component
interface MenuButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function MenuButton({ onClick, isOpen }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors lg:hidden"
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <div className="w-6 h-5 flex flex-col justify-between">
        <span
          className={`block h-0.5 bg-current transform transition-transform origin-left ${
            isOpen ? "rotate-45 translate-x-px" : ""
          }`}
        />
        <span
          className={`block h-0.5 bg-current transition-opacity ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 bg-current transform transition-transform origin-left ${
            isOpen ? "-rotate-45 translate-x-px" : ""
          }`}
        />
      </div>
    </button>
  );
}
