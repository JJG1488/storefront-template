/**
 * Premium themes configuration for GoSovereign stores.
 *
 * Theme presets define a consistent color palette that can be
 * applied across the entire storefront for a cohesive look.
 *
 * Premium themes are gated behind the Pro tier via the
 * `premiumThemesEnabled` feature flag.
 */

import { generateBrandVariants, isValidHex } from "./colors";

export interface ThemeColors {
  // Primary brand color - main accent
  primary: string;
  // Primary color at 10% opacity - for subtle backgrounds
  primary10: string;
  // Secondary accent color - for variety
  secondary: string;
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Border colors
  border: string;
  borderLight: string;
  // Footer colors
  footerBg: string;
  footerText: string;
  footerTextMuted: string;
}

/**
 * Dark mode color overrides.
 * Only the colors that change between light and dark mode.
 */
export interface DarkModeColors {
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  footerBg: string;
  footerText: string;
  footerTextMuted: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  colors: ThemeColors;
  dark: DarkModeColors;
  preview: {
    primary: string;
    accent: string;
    background: string;
  };
}

/**
 * Default theme preset - available to all tiers.
 *
 * Enhanced v9.45: Deeper jewel tones with improved contrast.
 * All colors verified for WCAG AA compliance (4.5:1 minimum).
 */
export const defaultTheme: ThemePreset = {
  id: "default",
  name: "Indigo",
  description: "Bold and professional with deep indigo accents",
  isPremium: false,
  colors: {
    primary: "#4f46e5",           // Deeper indigo (was #6366f1, L:67% → L:59%)
    primary10: "rgba(79, 70, 229, 0.1)",
    secondary: "#7c3aed",         // Rich violet (was #8b5cf6)
    bgPrimary: "#ffffff",
    bgSecondary: "#f1f5f9",       // More distinct (was #f9fafb)
    textPrimary: "#030712",       // Near black for max contrast (was #111827)
    textSecondary: "#374151",     // Darker gray (was #4b5563)
    textMuted: "#6b7280",         // Visible muted (was #9ca3af)
    border: "#d1d5db",            // More definition (was #e5e7eb)
    borderLight: "#e5e7eb",       // Enhanced (was #f3f4f6)
    footerBg: "#030712",          // True black footer
    footerText: "#ffffff",
    footerTextMuted: "#9ca3af",
  },
  dark: {
    bgPrimary: "#0a0a0a",         // True dark (was #111827)
    bgSecondary: "#171717",       // Rich dark (was #1f2937)
    textPrimary: "#fafafa",       // Bright white
    textSecondary: "#d4d4d8",     // Softer secondary
    textMuted: "#a1a1aa",
    border: "#27272a",            // Subtle border
    borderLight: "#1c1c1e",
    footerBg: "#000000",
    footerText: "#fafafa",
    footerTextMuted: "#a1a1aa",
  },
  preview: {
    primary: "#4f46e5",
    accent: "#7c3aed",
    background: "#ffffff",
  },
};

/**
 * Premium theme presets - available to Pro and Hosted tiers.
 *
 * Enhanced v9.45: Deeper jewel tones with improved contrast.
 * All colors verified for WCAG AA compliance (4.5:1 minimum).
 */
export const premiumThemes: ThemePreset[] = [
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep blues and teals inspired by the sea",
    isPremium: true,
    colors: {
      primary: "#0284c7",           // Deeper sky blue (was #0ea5e9)
      primary10: "rgba(2, 132, 199, 0.1)",
      secondary: "#0d9488",         // Rich teal (was #14b8a6)
      bgPrimary: "#ffffff",
      bgSecondary: "#f0f9ff",
      textPrimary: "#0c4a6e",       // Deep ocean text
      textSecondary: "#334155",     // Darker (was #475569)
      textMuted: "#64748b",         // Visible (was #94a3b8)
      border: "#bae6fd",            // More visible (was #e0f2fe)
      borderLight: "#e0f2fe",
      footerBg: "#082f49",          // Deeper footer
      footerText: "#ffffff",
      footerTextMuted: "#7dd3fc",
    },
    dark: {
      bgPrimary: "#082f49",         // Deep ocean night
      bgSecondary: "#0c4a6e",
      textPrimary: "#f0f9ff",
      textSecondary: "#bae6fd",
      textMuted: "#7dd3fc",
      border: "#0369a1",
      borderLight: "#0c4a6e",
      footerBg: "#021526",
      footerText: "#f0f9ff",
      footerTextMuted: "#7dd3fc",
    },
    preview: {
      primary: "#0284c7",
      accent: "#0d9488",
      background: "#f0f9ff",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep emerald greens for eco-conscious brands",
    isPremium: true,
    colors: {
      primary: "#047857",           // Deep emerald (was #059669)
      primary10: "rgba(4, 120, 87, 0.1)",
      secondary: "#65a30d",         // Rich lime (was #84cc16)
      bgPrimary: "#ffffff",
      bgSecondary: "#ecfdf5",
      textPrimary: "#052e16",       // Deeper forest text
      textSecondary: "#374151",     // Darker
      textMuted: "#6b7280",         // Visible
      border: "#a7f3d0",            // More visible (was #dcfce7)
      borderLight: "#d1fae5",
      footerBg: "#052e16",          // Deep forest
      footerText: "#ffffff",
      footerTextMuted: "#6ee7b7",
    },
    dark: {
      bgPrimary: "#052e16",         // Deep forest night
      bgSecondary: "#14532d",
      textPrimary: "#ecfdf5",
      textSecondary: "#a7f3d0",
      textMuted: "#6ee7b7",
      border: "#166534",
      borderLight: "#14532d",
      footerBg: "#021a0d",
      footerText: "#ecfdf5",
      footerTextMuted: "#6ee7b7",
    },
    preview: {
      primary: "#047857",
      accent: "#65a30d",
      background: "#ecfdf5",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Rich amber and coral for creative stores",
    isPremium: true,
    colors: {
      primary: "#ea580c",           // Deep amber (was #f97316)
      primary10: "rgba(234, 88, 12, 0.1)",
      secondary: "#db2777",         // Rich pink (was #ec4899)
      bgPrimary: "#ffffff",
      bgSecondary: "#fff7ed",
      textPrimary: "#431407",       // Deeper text (was #7c2d12)
      textSecondary: "#44403c",     // Darker stone
      textMuted: "#78716c",         // Visible
      border: "#fdba74",            // More visible (was #fed7aa)
      borderLight: "#fed7aa",
      footerBg: "#431407",          // Deep amber footer
      footerText: "#ffffff",
      footerTextMuted: "#fb923c",
    },
    dark: {
      bgPrimary: "#431407",         // Deep sunset night
      bgSecondary: "#7c2d12",
      textPrimary: "#fff7ed",
      textSecondary: "#fed7aa",
      textMuted: "#fdba74",
      border: "#9a3412",
      borderLight: "#7c2d12",
      footerBg: "#270b03",
      footerText: "#fff7ed",
      footerTextMuted: "#fb923c",
    },
    preview: {
      primary: "#ea580c",
      accent: "#db2777",
      background: "#fff7ed",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Rich violet for luxury and premium brands",
    isPremium: true,
    colors: {
      primary: "#7c3aed",           // Deep violet (was #8b5cf6)
      primary10: "rgba(124, 58, 237, 0.1)",
      secondary: "#db2777",         // Rich pink (was #ec4899)
      bgPrimary: "#ffffff",
      bgSecondary: "#faf5ff",
      textPrimary: "#2e1065",       // Deeper purple text (was #3b0764)
      textSecondary: "#4b5563",     // Neutral gray
      textMuted: "#6b7280",         // Visible
      border: "#ddd6fe",            // More visible (was #e9d5ff)
      borderLight: "#ede9fe",
      footerBg: "#2e1065",          // Deep midnight footer
      footerText: "#ffffff",
      footerTextMuted: "#a78bfa",
    },
    dark: {
      bgPrimary: "#2e1065",         // Deep midnight
      bgSecondary: "#3b0764",
      textPrimary: "#faf5ff",
      textSecondary: "#e9d5ff",
      textMuted: "#c4b5fd",
      border: "#4c1d95",
      borderLight: "#3b0764",
      footerBg: "#1a0a3e",
      footerText: "#faf5ff",
      footerTextMuted: "#a78bfa",
    },
    preview: {
      primary: "#7c3aed",
      accent: "#db2777",
      background: "#faf5ff",
    },
  },
  {
    id: "slate",
    name: "Slate",
    description: "Sophisticated neutral tones for modern brands",
    isPremium: true,
    colors: {
      primary: "#334155",           // Deeper slate (was #475569)
      primary10: "rgba(51, 65, 85, 0.1)",
      secondary: "#0284c7",         // Rich sky blue (was #0ea5e9)
      bgPrimary: "#ffffff",
      bgSecondary: "#f1f5f9",       // More distinct
      textPrimary: "#020617",       // Near black (was #0f172a)
      textSecondary: "#334155",     // Darker
      textMuted: "#64748b",         // Visible
      border: "#cbd5e1",            // More visible (was #e2e8f0)
      borderLight: "#e2e8f0",
      footerBg: "#020617",          // True black footer
      footerText: "#ffffff",
      footerTextMuted: "#94a3b8",
    },
    dark: {
      bgPrimary: "#020617",         // Near black
      bgSecondary: "#0f172a",
      textPrimary: "#f8fafc",
      textSecondary: "#cbd5e1",
      textMuted: "#94a3b8",
      border: "#1e293b",
      borderLight: "#0f172a",
      footerBg: "#000000",
      footerText: "#f8fafc",
      footerTextMuted: "#94a3b8",
    },
    preview: {
      primary: "#334155",
      accent: "#0284c7",
      background: "#f1f5f9",
    },
  },
];

/**
 * All available themes (default + premium).
 */
export const allThemes: ThemePreset[] = [defaultTheme, ...premiumThemes];

/**
 * Get a theme preset by ID.
 * Falls back to default if theme not found.
 */
export function getThemeById(themeId: string): ThemePreset {
  return allThemes.find((t) => t.id === themeId) || defaultTheme;
}

/**
 * Generate CSS variables from a theme preset.
 * Includes auto-generated hover/active variants for buttons.
 * @param theme - The theme preset to generate CSS for
 * @param isDarkMode - Whether to use dark mode colors (default: false)
 */
export function generateThemeCSS(theme: ThemePreset, isDarkMode = false): string {
  const { colors, dark } = theme;
  // Generate brand color variants for hover/active states
  const brandVariants = generateBrandVariants(colors.primary);
  const secondaryVariants = generateBrandVariants(colors.secondary);

  // Use dark mode colors for bg, text, border, footer if enabled
  const bgPrimary = isDarkMode ? dark.bgPrimary : colors.bgPrimary;
  const bgSecondary = isDarkMode ? dark.bgSecondary : colors.bgSecondary;
  const textPrimary = isDarkMode ? dark.textPrimary : colors.textPrimary;
  const textSecondary = isDarkMode ? dark.textSecondary : colors.textSecondary;
  const textMuted = isDarkMode ? dark.textMuted : colors.textMuted;
  const border = isDarkMode ? dark.border : colors.border;
  const borderLight = isDarkMode ? dark.borderLight : colors.borderLight;
  const footerBg = isDarkMode ? dark.footerBg : colors.footerBg;
  const footerText = isDarkMode ? dark.footerText : colors.footerText;
  const footerTextMuted = isDarkMode ? dark.footerTextMuted : colors.footerTextMuted;

  return `
    :root {
      --brand-color: ${colors.primary};
      --brand-color-10: ${colors.primary10};
      --brand-hover: ${brandVariants.hover};
      --brand-active: ${brandVariants.active};
      --brand-light: ${brandVariants.light};
      --secondary-color: ${colors.secondary};
      --secondary-hover: ${secondaryVariants.hover};
      --secondary-active: ${secondaryVariants.active};
      --bg-primary: ${bgPrimary};
      --bg-secondary: ${bgSecondary};
      --text-primary: ${textPrimary};
      --text-secondary: ${textSecondary};
      --text-muted: ${textMuted};
      --border-color: ${border};
      --border-light: ${borderLight};
      --footer-bg: ${footerBg};
      --footer-text: ${footerText};
      --footer-text-muted: ${footerTextMuted};
    }
  `;
}

/**
 * Get themes available for a given tier.
 */
export function getAvailableThemes(isPremiumEnabled: boolean): ThemePreset[] {
  if (isPremiumEnabled) {
    return allThemes;
  }
  return allThemes.filter((t) => !t.isPremium);
}
