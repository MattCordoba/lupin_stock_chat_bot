import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Lupin brand gold (from logo)
        gold: {
          50: "#fdf9f3",
          100: "#f9f0e0",
          200: "#f2dfc0",
          300: "#e9c896",
          400: "#d4a864",
          500: "#c69548", // Primary gold
          600: "#b8863d",
          700: "#996b34",
          800: "#7c5630",
          900: "#66472a",
        },
        // Dark theme colors
        dark: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9d9de",
          300: "#b8b8c1",
          400: "#91919f",
          500: "#737384",
          600: "#5d5d6b",
          700: "#4c4c57",
          800: "#18181b", // Main background
          900: "#0f0f11", // Darker background
          950: "#09090b",
        },
        // Semantic colors
        hype: {
          low: "#6b7280",    // Gray - low interest
          medium: "#f59e0b", // Amber - moderate
          high: "#22c55e",   // Green - bullish
          extreme: "#ef4444", // Red - potentially overheated
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(198, 149, 72, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(198, 149, 72, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
