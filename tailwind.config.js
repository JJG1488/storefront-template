/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--brand-color, #6366f1)",
          hover: "var(--brand-hover, #4f46e5)",
          active: "var(--brand-active, #4338ca)",
          light: "var(--brand-light, #a5b4fc)",
        },
        secondary: {
          DEFAULT: "var(--secondary-color, #8b5cf6)",
          hover: "var(--secondary-hover, #7c3aed)",
          active: "var(--secondary-active, #6d28d9)",
        },
      },
    },
  },
  plugins: [],
};
