/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      spacing: {
        "nav-rail": "55px",
        "nav-expanded": "225px",
      },
      colors: {
        dark: "rgba(45, 45, 45, 0.85)",
        border: "hsl(var(--border))",
        "border-light": "hsl(var(--border-light))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        sidebar: "hsl(var(--sidebar-bg))",
        "sidebar-bg": "hsl(var(--sidebar-bg))",
        "mobile-topbar-bg": "hsl(var(--mobile-topbar-bg))",
        "mobile-topbar-border": "hsl(var(--mobile-topbar-border))",
        nav: "hsl(var(--nav-bg))",
        "card-bg": "hsl(var(--card-bg))",
        "accent-yellow": "hsl(var(--accent-yellow))",
        "filter-active": "hsl(var(--filter-active))",
        "filter-hover": "hsl(var(--filter-hover))",
        "filter-border": "hsl(var(--filter-border))",
        "sidebar-border": "hsl(var(--sidebar-border))",
        "card-mobile": "hsl(var(--card-bg-mobile))",
        available: "hsl(var(--available))",
        sold: "hsl(var(--sold))",
        reserved: "hsl(var(--reserved))",
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
      fontFamily: {
        sans: ["'Open Sans'", "sans-serif"],
        "open-sans": ["'Open Sans'", "sans-serif"],
        inter: ["'Inter'", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Left-right sway for the home-page drag hint's hand icon — reads as
        // "swipe left/right" (see src/containers/home/drag-hint.jsx). Kept
        // small since the hand sits inline between two flanking chevrons —
        // wide enough to sway is fine, wide enough to reach them is not.
        "drag-hint": {
          "0%, 100%": { transform: "translateX(-10px)" },
          "50%": { transform: "translateX(10px)" },
        },
      },
      animation: {
        // Fast start, long soft settle — reads as weighty rather than snappy.
        "accordion-down": "accordion-down 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        "accordion-up": "accordion-up 200ms cubic-bezier(0.32, 0.72, 0, 1)",
        "drag-hint": "drag-hint 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
