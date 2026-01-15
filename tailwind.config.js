/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Enhanced v9.45: Deeper jewel tones with improved contrast
        brand: {
          DEFAULT: "var(--brand-color, #4f46e5)",     // Deep indigo (was #6366f1)
          hover: "var(--brand-hover, #4338ca)",       // Darker hover
          active: "var(--brand-active, #3730a3)",     // Darkest active
          light: "var(--brand-light, #818cf8)",
        },
        secondary: {
          DEFAULT: "var(--secondary-color, #7c3aed)", // Rich violet (was #8b5cf6)
          hover: "var(--secondary-hover, #6d28d9)",
          active: "var(--secondary-active, #5b21b6)",
        },
      },
      fontWeight: {
        heading: "var(--font-weight-heading, 600)",
      },
    },
  },
  plugins: [],
};
