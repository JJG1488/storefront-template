"use client";

import Link from "next/link";
import { CartIcon } from "./CartIcon";
import { getStoreConfig } from "@/lib/store";

export function Header() {
  const store = getStoreConfig();

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className="h-10" />
          ) : (
            <span className="text-xl font-bold">{store.name}</span>
          )}
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/" className="hover:text-brand">
            Home
          </Link>
          <CartIcon />
        </nav>
      </div>
    </header>
  );
}
