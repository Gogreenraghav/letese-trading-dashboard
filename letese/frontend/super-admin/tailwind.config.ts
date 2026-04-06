import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brandBlue: "#1A4FBF",
        brandGreen: "#22C55E",
        neonCyan: "#00D4FF",
        electricPurple: "#8B5CF6",
        bgObsidian: "#0A0E1A",
        bgNavy: "#111827",
        bgGlass: "rgba(255,255,255,0.04)",
        borderGlass: "rgba(255,255,255,0.08)",
        borderGlassHover: "rgba(255,255,255,0.16)",
        textPrimary: "#F1F5F9",
        textSecondary: "#94A3B8",
        textMuted: "#475569",
        statusGreen: "#22C55E",
        statusRed: "#EF4444",
        statusYellow: "#F59E0B",
        statusOrange: "#F97316",
        statusBlue: "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        "glass-sm": "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        neon: "0 0 20px rgba(0,212,255,0.3)",
        "neon-glow": "0 0 40px rgba(0,212,255,0.15)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #1A4FBF 0%, #8B5CF6 100%)",
        "gradient-glass": "linear-gradient(135deg, rgba(26,79,191,0.1) 0%, rgba(139,92,246,0.1) 100%)",
        "gradient-card": "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
