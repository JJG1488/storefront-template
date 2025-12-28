/**
 * Premium themes configuration for GoSovereign stores.
 *
 * Theme presets define a consistent color palette that can be
 * applied across the entire storefront for a cohesive look.
 *
 * Premium themes are gated behind the Pro tier via the
 * `premiumThemesEnabled` feature flag.
 */

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

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  colors: ThemeColors;
  preview: {
    primary: string;
    accent: string;
    background: string;
  };
}

/**
 * Default theme preset - available to all tiers.
 */
export const defaultTheme: ThemePreset = {
  id: "default",
  name: "Indigo",
  description: "Clean and professional with indigo accents",
  isPremium: false,
  colors: {
    primary: "#6366f1",
    primary10: "rgba(99, 102, 241, 0.1)",
    secondary: "#8b5cf6",
    bgPrimary: "#ffffff",
    bgSecondary: "#f9fafb",
    textPrimary: "#111827",
    textSecondary: "#4b5563",
    textMuted: "#9ca3af",
    border: "#e5e7eb",
    borderLight: "#f3f4f6",
    footerBg: "#111827",
    footerText: "#ffffff",
    footerTextMuted: "#9ca3af",
  },
  preview: {
    primary: "#6366f1",
    accent: "#8b5cf6",
    background: "#ffffff",
  },
};

/**
 * Premium theme presets - available to Pro and Hosted tiers.
 */
export const premiumThemes: ThemePreset[] = [
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool blues and teals inspired by the sea",
    isPremium: true,
    colors: {
      primary: "#0ea5e9",
      primary10: "rgba(14, 165, 233, 0.1)",
      secondary: "#14b8a6",
      bgPrimary: "#ffffff",
      bgSecondary: "#f0f9ff",
      textPrimary: "#0c4a6e",
      textSecondary: "#475569",
      textMuted: "#94a3b8",
      border: "#e0f2fe",
      borderLight: "#f0f9ff",
      footerBg: "#0c4a6e",
      footerText: "#ffffff",
      footerTextMuted: "#7dd3fc",
    },
    preview: {
      primary: "#0ea5e9",
      accent: "#14b8a6",
      background: "#f0f9ff",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Natural greens for eco-friendly brands",
    isPremium: true,
    colors: {
      primary: "#059669",
      primary10: "rgba(5, 150, 105, 0.1)",
      secondary: "#84cc16",
      bgPrimary: "#ffffff",
      bgSecondary: "#f0fdf4",
      textPrimary: "#14532d",
      textSecondary: "#4b5563",
      textMuted: "#9ca3af",
      border: "#dcfce7",
      borderLight: "#f0fdf4",
      footerBg: "#14532d",
      footerText: "#ffffff",
      footerTextMuted: "#86efac",
    },
    preview: {
      primary: "#059669",
      accent: "#84cc16",
      background: "#f0fdf4",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm oranges and pinks for creative stores",
    isPremium: true,
    colors: {
      primary: "#f97316",
      primary10: "rgba(249, 115, 22, 0.1)",
      secondary: "#ec4899",
      bgPrimary: "#ffffff",
      bgSecondary: "#fff7ed",
      textPrimary: "#7c2d12",
      textSecondary: "#57534e",
      textMuted: "#a8a29e",
      border: "#fed7aa",
      borderLight: "#fff7ed",
      footerBg: "#7c2d12",
      footerText: "#ffffff",
      footerTextMuted: "#fdba74",
    },
    preview: {
      primary: "#f97316",
      accent: "#ec4899",
      background: "#fff7ed",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep purples for luxury and premium brands",
    isPremium: true,
    colors: {
      primary: "#8b5cf6",
      primary10: "rgba(139, 92, 246, 0.1)",
      secondary: "#ec4899",
      bgPrimary: "#ffffff",
      bgSecondary: "#faf5ff",
      textPrimary: "#3b0764",
      textSecondary: "#6b7280",
      textMuted: "#9ca3af",
      border: "#e9d5ff",
      borderLight: "#faf5ff",
      footerBg: "#3b0764",
      footerText: "#ffffff",
      footerTextMuted: "#c4b5fd",
    },
    preview: {
      primary: "#8b5cf6",
      accent: "#ec4899",
      background: "#faf5ff",
    },
  },
  {
    id: "slate",
    name: "Slate",
    description: "Minimal and modern with neutral tones",
    isPremium: true,
    colors: {
      primary: "#475569",
      primary10: "rgba(71, 85, 105, 0.1)",
      secondary: "#0ea5e9",
      bgPrimary: "#ffffff",
      bgSecondary: "#f8fafc",
      textPrimary: "#0f172a",
      textSecondary: "#475569",
      textMuted: "#94a3b8",
      border: "#e2e8f0",
      borderLight: "#f1f5f9",
      footerBg: "#0f172a",
      footerText: "#ffffff",
      footerTextMuted: "#94a3b8",
    },
    preview: {
      primary: "#475569",
      accent: "#0ea5e9",
      background: "#f8fafc",
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
 */
export function generateThemeCSS(theme: ThemePreset): string {
  const { colors } = theme;
  return `
    :root {
      --brand-color: ${colors.primary};
      --brand-color-10: ${colors.primary10};
      --secondary-color: ${colors.secondary};
      --bg-primary: ${colors.bgPrimary};
      --bg-secondary: ${colors.bgSecondary};
      --text-primary: ${colors.textPrimary};
      --text-secondary: ${colors.textSecondary};
      --text-muted: ${colors.textMuted};
      --border-color: ${colors.border};
      --border-light: ${colors.borderLight};
      --footer-bg: ${colors.footerBg};
      --footer-text: ${colors.footerText};
      --footer-text-muted: ${colors.footerTextMuted};
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
