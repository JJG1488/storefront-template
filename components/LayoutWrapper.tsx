"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import type { RuntimeSettings } from "@/lib/settings";

interface LayoutWrapperProps {
  settings: RuntimeSettings;
  children: React.ReactNode;
}

export function LayoutWrapper({ settings, children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    // Admin pages use their own layout from app/admin/layout.tsx
    // Don't render public Header/Footer
    return <>{children}</>;
  }

  return (
    <>
      <Header settings={settings} />
      <main className="min-h-screen">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
