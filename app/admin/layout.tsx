"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AdminContext } from "@/lib/admin-context";

function LoginForm({ onLogin }: { onLogin: (password: string) => Promise<boolean> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await onLogin(password);
    if (!success) {
      setError("Invalid password");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="/admin/forgot-password"
                className="text-sm text-brand hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              autoFocus
            />
          </div>
          {error && (
            <div className="text-sm mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminNav({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/coupons", label: "Coupons" },
    { href: "/admin/gift-cards", label: "Gift Cards" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/abandoned-carts", label: "Abandoned Carts" },
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <nav className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - always visible */}
          <Link href="/admin" className="font-bold text-lg">
            Store Admin
          </Link>

          {/* Desktop nav - hidden on mobile */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-gray-300 ${
                  pathname === link.href ? "text-white font-medium" : "text-gray-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/" className="text-gray-400 hover:text-white text-sm">
              View Store
            </Link>
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-white text-sm ml-2 px-3 py-1 border border-gray-600 rounded hover:border-gray-400 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile hamburger - visible only on mobile, RIGHT side */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 px-3 rounded-lg ${
                  pathname === link.href
                    ? "bg-gray-800 text-white font-medium"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-700 my-2" />
            <Link
              href="/"
              className="block py-2 px-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              View Store
            </Link>
            <button
              onClick={onLogout}
              className="block w-full text-left py-2 px-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  // Allow password-related pages to bypass authentication
  const isPublicPage = pathname === "/admin/reset-password" || pathname === "/admin/forgot-password";

  useEffect(() => {
    // Skip auth check for public pages
    if (isPublicPage) {
      setChecking(false);
      return;
    }

    const token = localStorage.getItem("admin_token");
    if (token) {
      // Verify token is still valid
      fetch("/api/admin/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) setIsAuthenticated(true);
          else localStorage.removeItem("admin_token");
        })
        .catch(() => localStorage.removeItem("admin_token"))
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [isPublicPage]);

  async function login(password: string): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem("admin_token", token);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Allow public pages to render without authentication
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-gray-100">
        {children}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <AdminContext.Provider value={{ isAuthenticated, login, logout }}>
      <div className="min-h-screen bg-gray-100">
        <AdminNav onLogout={logout} />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </div>
    </AdminContext.Provider>
  );
}
