import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { CartProvider } from "@/components/CartContext";
import { WishlistProvider } from "@/components/WishlistContext";
import { CustomerAuthProvider } from "@/components/CustomerAuthContext";
import { getStoreConfig } from "@/lib/store";
import { getThemeById, generateThemeCSS } from "@/lib/themes";
import { getFontById, generateFontCSS } from "@/lib/fonts";
import { getStoreSettingsFromDB } from "@/lib/settings";

// Force dynamic rendering so settings changes appear for all visitors
export const dynamic = "force-dynamic";

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
  const themeCSS = generateThemeCSS(theme, settings.darkModeEnabled);
  const font = getFontById(settings.fontPreset);
  const fontCSS = generateFontCSS(font);

  return (
    <html lang="en">
      <head>
        {/* Load Google Fonts if using a custom font preset */}
        {font.googleFontsUrl && (
          <link href={font.googleFontsUrl} rel="stylesheet" />
        )}
        <style
          dangerouslySetInnerHTML={{
            __html: themeCSS + fontCSS,
          }}
        />
      </head>
      <body className={inter.className}>
        <CustomerAuthProvider>
          <CartProvider>
            <WishlistProvider>
              <LayoutWrapper settings={settings}>
                {children}
              </LayoutWrapper>
            </WishlistProvider>
          </CartProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
