import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        accentStrong: 'rgb(var(--accent-strong) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        cloud: 'rgb(var(--cloud) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 24px 60px -40px rgba(15, 23, 42, 0.45)',
        glow: '0 0 0 1px rgba(14, 165, 233, 0.15), 0 10px 30px -18px rgba(14, 165, 233, 0.45)',
      },
    },
  },
  plugins: [],
} satisfies Config;
