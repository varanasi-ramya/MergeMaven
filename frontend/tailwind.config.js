// Tailwind CSS configuration for MergeMaven frontend.

/**
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono', 'Monaco', 'Menlo', 'Consolas', 'Courier New', 'monospace'],
      },
      colors: {
        // Brand palette
        burgundy: {
          '50': '#FDF2F2',
          '100': '#FCE4E6',
          '200': '#FAD6D9',
          '300': '#F8C7CB',
          '400': '#F6A8AF',
          '500': '#E58292', // Main burgundy
          '600': '#D56982',
          '700': '#C75E72',
          '800': '#B94662',
          '900': '#A42E4D',
        },
        warm: {
          '50': '#FAF7F3',
          '100': '#F5EDE1',
          '200': '#EFE0BE',
          '300': '#E9D39B',
          '400': '#E4C578',
          '500': '#DEB75B', // Warm accent
          '600': '#D9A94E',
          '700': '#D39A42',
          '800': '#CE8B36',
          '900': '#C87B29',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}