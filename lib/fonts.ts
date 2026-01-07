/**
 * Font preset system for GoSovereign stores.
 *
 * Font presets provide curated font combinations that can be
 * applied across the entire storefront for a cohesive look.
 *
 * Uses Google Fonts for wide browser support and performance.
 */

export interface FontPreset {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  googleFontsUrl: string;
  isPremium: boolean;
}

/**
 * Available font presets.
 * Default preset uses system fonts for fastest loading.
 */
export const fontPresets: FontPreset[] = [
  {
    id: "default",
    name: "System",
    description: "Clean system fonts for fastest loading",
    headingFont: "system-ui, -apple-system, sans-serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    googleFontsUrl: "", // No external fonts needed
    isPremium: false,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Inter - clean and highly legible",
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    isPremium: false,
  },
  {
    id: "classic",
    name: "Classic",
    description: "Playfair Display + Source Sans Pro",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@400;600&display=swap",
    isPremium: true,
  },
  {
    id: "bold",
    name: "Bold",
    description: "Montserrat + Open Sans",
    headingFont: "'Montserrat', sans-serif",
    bodyFont: "'Open Sans', sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Open+Sans:wght@400;600&display=swap",
    isPremium: true,
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Cormorant Garamond + Lato",
    headingFont: "'Cormorant Garamond', serif",
    bodyFont: "'Lato', sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Lato:wght@400;700&display=swap",
    isPremium: true,
  },
  {
    id: "tech",
    name: "Tech",
    description: "Space Grotesk + IBM Plex Sans",
    headingFont: "'Space Grotesk', sans-serif",
    bodyFont: "'IBM Plex Sans', sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap",
    isPremium: true,
  },
];

/**
 * All available fonts.
 */
export const allFonts: FontPreset[] = fontPresets;

/**
 * Get a font preset by ID.
 * Falls back to default if font not found.
 */
export function getFontById(fontId: string): FontPreset {
  return fontPresets.find((f) => f.id === fontId) || fontPresets[0];
}

/**
 * Generate CSS for font family variables.
 */
export function generateFontCSS(font: FontPreset): string {
  return `
    :root {
      --font-heading: ${font.headingFont};
      --font-body: ${font.bodyFont};
    }
  `;
}

/**
 * Get fonts available for a given tier.
 */
export function getAvailableFonts(isPremiumEnabled: boolean): FontPreset[] {
  if (isPremiumEnabled) {
    return allFonts;
  }
  return allFonts.filter((f) => !f.isPremium);
}
