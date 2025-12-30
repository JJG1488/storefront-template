import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartContext";
import { WishlistProvider } from "@/components/WishlistContext";
import { getStoreConfig } from "@/lib/store";
import { getThemeById, generateThemeCSS } from "@/lib/themes";
import { getStoreSettingsFromDB } from "@/lib/settings";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const store = getStoreConfig();
  return {
    title: store.name,
    description: `Welcome to ${store.name}`,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = getStoreConfig();
  // Fetch all runtime settings from database (falls back to env vars)
  const settings = await getStoreSettingsFromDB();
  const theme = getThemeById(settings.themePreset);
  const themeCSS = generateThemeCSS(theme);

  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: themeCSS,
          }}
        />
      </head>
      <body className={inter.className}>
        <CartProvider>
          <WishlistProvider>
            <Header settings={settings} />
            <main className="min-h-screen">{children}</main>
            <Footer settings={settings} />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
