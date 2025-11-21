import type { Config } from "tailwindcss";
import { colors as brandColors, typography } from "@i4g/tokens";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui-kit/src/**/*.{ts,tsx}",
    "../../packages/tokens/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: brandColors.primary,
        "primary-accent": brandColors.primaryAccent,
        secondary: brandColors.secondary,
        accent: brandColors.accent,
        neutral: brandColors.neutral,
      },
      fontFamily: {
        sans: [typography.fontSans, "system-ui", "sans-serif"],
        display: [typography.fontDisplay, "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
