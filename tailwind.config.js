/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF0FF",
          100: "#E0E4FF",
          200: "#C3C9FF",
          400: "#7B7FF5",
          500: "#5B5FEF",
          600: "#4A4DE6",
          700: "#3A3ACB",
          900: "#1E1B4B",
        },
        ink: {
          900: "#0F1222",
          700: "#2B2E45",
          500: "#5B5F7A",
          300: "#9CA0BA",
        },
        canvas: "#F7F8FC",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 18, 34, 0.04), 0 8px 24px rgba(15, 18, 34, 0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
