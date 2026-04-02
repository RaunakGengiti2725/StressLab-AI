import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#09090b",
          1: "#111114",
          2: "#18181b",
          3: "#1f1f23",
          4: "#27272a",
        },
        border: {
          DEFAULT: "#27272a",
          subtle: "#1f1f23",
        },
        accent: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
          muted: "#1e3a5f",
        },
        danger: {
          DEFAULT: "#ef4444",
          muted: "#5c1c1c",
        },
        success: {
          DEFAULT: "#22c55e",
          muted: "#14532d",
        },
        warning: {
          DEFAULT: "#eab308",
          muted: "#713f12",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
