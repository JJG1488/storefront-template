import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartContext";
import { WishlistProvider } from "@/components/WishlistContext";
import { getStoreConfig } from "@/lib/store";
import { getThemeById, generateThemeCSS } from "@/lib/themes";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const store = getStoreConfig();
  return {
    title: store.name,
    description: `Welcome to ${store.name}`,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = getStoreConfig();
  const theme = getThemeById(store.themePreset);
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
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
