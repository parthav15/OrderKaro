const { bordeauxNoir } = require("./src/theme/tokens")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: bordeauxNoir.dark.primary,
          hover: bordeauxNoir.dark.primaryHover,
          pressed: bordeauxNoir.dark.primaryPressed,
        },
        accent: bordeauxNoir.dark.accent,
        canvas: bordeauxNoir.dark.canvas,
        surface: {
          DEFAULT: bordeauxNoir.dark.surface,
          elevated: bordeauxNoir.dark.surfaceElevated,
        },
        ink: bordeauxNoir.dark.ink,
        muted: bordeauxNoir.dark.muted,
        line: bordeauxNoir.dark.line,
        success: bordeauxNoir.dark.success,
        warning: bordeauxNoir.dark.warning,
        danger: bordeauxNoir.dark.danger,
      },
      fontFamily: {
        serif: ["PlayfairDisplay_700Bold", "Georgia", "serif"],
        "serif-italic": ["PlayfairDisplay_600SemiBold_Italic", "Georgia", "serif"],
        sans: ["Inter_400Regular", "System"],
        "sans-medium": ["Inter_500Medium", "System"],
        "sans-semibold": ["Inter_600SemiBold", "System"],
        "sans-bold": ["Inter_700Bold", "System"],
      },
    },
  },
  plugins: [],
}
