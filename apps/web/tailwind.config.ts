import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "rgb(var(--brand-red) / <alpha-value>)",
          black: "#1A1512",
          white: "#FFFFFF",
          gold: "rgb(var(--accent) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--brand-red) / <alpha-value>)",
          hover: "rgb(var(--primary-hover) / <alpha-value>)",
          pressed: "rgb(var(--primary-pressed) / <alpha-value>)",
        },
        accent: "rgb(var(--accent) / <alpha-value>)",
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated) / <alpha-value>)",
        },
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        neutral: {
          50: "#FAF7F2",
          100: "#F2EDE5",
          200: "#E7DFD4",
          300: "#D6CABB",
          400: "#A89C90",
          500: "#6B615A",
          600: "#574E48",
          700: "#423A35",
          800: "#2B2521",
          900: "#1A1512",
          950: "#141110",
        },
        red: {
          50: "#FBEEF0",
          100: "#F6DADE",
          200: "#EDB6BF",
          300: "#E0899A",
          400: "#CE5268",
          500: "#A31D33",
          600: "#8E1A2D",
          700: "#7A1626",
          800: "#661320",
          900: "#55111B",
          950: "#300910",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        heading: ['"Instrument Sans"', '"DM Sans"', "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
      },
    },
  },
  plugins: [],
}

export default config
