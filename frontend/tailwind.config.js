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
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Light Cream Base with Popping Maroon & Brown
        burgundy: {
          DEFAULT: 'var(--burgundy-primary)',
          primary: 'var(--burgundy-primary)',
          light: 'var(--burgundy-light)',
        },
        brown: {
          DEFAULT: 'var(--brown-accent)',
          accent: 'var(--brown-accent)',
          deep: 'var(--brown-deep)',
          surface: 'var(--brown-surface)',
          elevated: 'var(--brown-elevated)',
        },
        beige: {
          DEFAULT: 'var(--beige-warm)',
          warm: 'var(--beige-warm)',
        },
        sand: {
          DEFAULT: 'var(--sand-muted)',
          muted: 'var(--sand-muted)',
        },
        cream: {
          DEFAULT: 'var(--cream-light)',
          light: 'var(--cream-light)',
        },
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border)',
          hover: 'var(--border-hover)',
        },
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
          elevated: 'var(--card-elevated)',
        },
      },
      borderRadius: {
        '2xl': 'var(--radius)', // 16px
        xl: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius-sm)', // 10px
        md: 'calc(var(--radius-sm) - 2px)',
        sm: 'calc(var(--radius-sm) - 4px)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}