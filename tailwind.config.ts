import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["var(--font-poppins)", "sans-serif"],
      },
      colors: {
        primary: "#3b82f6",
        accent: "#6366f1",
        success: "#10b981",
        danger: "#ef4444",
        "text-primary": "#1e293b",
        "text-muted": "#64748b",
      },
      animation: {
        "cell-cancel": "cellCancel 100ms ease-out",
        "badge-pulse": "badgePulse 400ms ease-out",
        "slide-in": "slideIn 200ms ease-out",
        "modal-in": "modalIn 300ms ease-out",
        "flash": "flash 150ms ease-out",
      },
      keyframes: {
        cellCancel: {
          "0%": { transform: "scale(0.93)" },
          "100%": { transform: "scale(1)" },
        },
        badgePulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.22)" },
        },
        slideIn: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        modalIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        flash: {
          "0%, 100%": { backgroundColor: "rgba(255,255,255,0.65)" },
          "50%": { backgroundColor: "rgba(59,130,246,0.15)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
