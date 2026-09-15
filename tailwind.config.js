/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── IAA Prompt Academy — Day Ops / Night Ops tokens (design.md §2) ──
        paper: '#F5F1E8',
        'paper-bright': '#FBF8F1',
        'paper-dim': '#EDE7D9',
        ink: {
          300: '#A9A294',
          500: '#6E685B',
          700: '#3D3930',
          900: '#211E17',
        },
        line: '#DCD4C3',
        amber: {
          100: '#F9E8CB',
          400: '#F0A82E',
          500: '#E09112',
          // darkened from #B9770E (3.26:1 on paper) → 5.25:1 on paper, 4.91:1 on amber-100 (WCAG AA)
          600: '#8A5A0A',
        },
        field: {
          100: '#DFEAE1',
          500: '#3F7D5C',
          600: '#2E5B44',
        },
        signal: {
          100: '#F5DFD9',
          500: '#C24A3B',
          600: '#A23B2E',
        },
        slate: {
          100: '#E2E9EB',
          500: '#5C7A89',
          600: '#46616F',
        },
        tarmac: {
          700: '#3A352A',
          800: '#29251C',
          900: '#1E1B14',
          950: '#16140F',
        },
        fog: {
          100: '#F1EDE2',
          300: '#C9C2B1',
          500: '#96907F',
        },
        glow: {
          amber: '#F2A93B',
          green: '#6FB98D',
          red: '#E06A55',
        },
        // ── shadcn/ui theme bridge (mapped to brand in index.css) ──
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
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
      fontFamily: {
        sans: ['Overpass', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        editorial: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: '0 1px 2px rgba(33,30,23,0.06)',
        'card-hover': '0 8px 24px rgba(33,30,23,0.10)',
        modal: '0 24px 64px rgba(22,20,15,0.28)',
        'glow-ring': '0 0 0 3px rgba(224,145,18,0.25)',
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
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "taxiway-blink": {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        "beacon-pulse": {
          "0%": { opacity: "0.4", transform: "scale(1)" },
          "70%, 100%": { opacity: "0", transform: "scale(1.06)" },
        },
        "dash-crawl": {
          from: { "stroke-dashoffset": "0" },
          to: { "stroke-dashoffset": "-48" },
        },
        "radar-sweep": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "flap-flip": {
          from: { transform: "rotateX(90deg)" },
          to: { transform: "rotateX(0deg)" },
        },
        "node-ping": {
          "0%": { transform: "scale(0)", opacity: "0.9" },
          "80%, 100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "taxiway-blink": "taxiway-blink 1s ease-in-out infinite",
        "beacon-pulse": "beacon-pulse 3s ease-out infinite",
        "dash-crawl": "dash-crawl 60s linear infinite",
        "radar-sweep": "radar-sweep 6s linear infinite",
        "flap-flip": "flap-flip 0.3s cubic-bezier(0.22,1,0.36,1) both",
        "node-ping": "node-ping 2s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
