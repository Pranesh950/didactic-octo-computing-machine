/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: {
          0: "#eceded",
          100: "#c6c8cd",
          200: "#a4a7ae",
          300: "#878a94",
          400: "#6a6d78",
          500: "#5d6069",
          600: "#3f4148",
          700: "#2a2b32",
          800: "#1f2026",
          900: "#17181d",
          950: "#111215",
          1000: "#0d0e10",
        },
        accent: {
          50: "#f0f1fe",
          100: "#d6d8fb",
          200: "#b8baf6",
          300: "#8c8eef",
          400: "#6e70e9",
          500: "#5e6ad2",
          600: "#4e57b8",
          700: "#3d449a",
          800: "#2f3576",
          900: "#202550",
          950: "#131732",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', '"SF Mono"', '"Fira Code"', "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "0.875rem" }],
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "scale-in": "scaleIn 0.15s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      boxShadow: {
        "modal": "0 0 0 1px rgba(255,255,255,0.05), 0 16px 48px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
