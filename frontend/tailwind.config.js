/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#07080B",
        canvasSubtle: "#0D1017",
        surface: "rgba(18, 22, 31, 0.70)",
        surfaceElevated: "rgba(26, 32, 46, 0.85)",
        surfaceDeep: "#0A0C12",
        borderLight: "rgba(255, 255, 255, 0.08)",
        borderHighlight: "rgba(255, 255, 255, 0.16)",
        borderGlowCyan: "rgba(0, 242, 254, 0.35)",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
        textMuted: "#64748B",
        accentCyan: "#00F2FE",
        accentBlue: "#3B82F6",
        accentEmerald: "#10B981",
        accentAmber: "#F59E0B",
        accentCrimson: "#EF4444",
        accentViolet: "#8B5CF6",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'float': '0 20px 45px -12px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
        'float-lg': '0 30px 60px -15px rgba(0, 0, 0, 0.85), 0 0 2px 1px rgba(0, 242, 254, 0.25)',
        'glow-cyan': '0 0 30px -5px rgba(0, 242, 254, 0.35)',
        'glow-emerald': '0 0 30px -5px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 30px -5px rgba(245, 158, 11, 0.35)',
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Geist Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(0.97)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
};
