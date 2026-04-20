/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        "paper-2": "var(--paper-2)",
        "paper-3": "var(--paper-3)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--ink-faint)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        sage: "var(--sage)",
        ocean: "var(--ocean)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter Tight", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
