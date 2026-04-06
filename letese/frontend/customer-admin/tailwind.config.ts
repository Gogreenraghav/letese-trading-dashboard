import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#e0eaff",
          200: "#c7d4ff",
          300: "#a3b8ff",
          400: "#7A8FFF",
          500: "#4A5FFF",
          600: "#3A4BCC",
          700: "#2E3D99",
          800: "#253380",
          900: "#1E2866",
        },
        neon: {
          cyan: "#00D4FF",
          green: "#00FF88",
          purple: "#8B5CF6",
          pink: "#FF3CAC",
          amber: "#F59E0B",
          blue: "#1A4FBF",
        },
        glass: {
          bg: "rgba(15, 20, 40, 0.75)",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.04)",
        },
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
        "brand-gradient": "linear-gradient(135deg, #4A5FFF 0%, #8B5CF6 50%, #00D4FF 100%)",
        "dark-gradient": "linear-gradient(180deg, #080c14 0%, #0d1224 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "neon-cyan": "0 0 20px rgba(0, 212, 255, 0.3)",
        "neon-purple": "0 0 20px rgba(139, 92, 246, 0.3)",
        "neon-green": "0 0 20px rgba(0, 255, 136, 0.3)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
